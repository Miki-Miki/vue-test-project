import { onMounted, onUnmounted, ref } from 'vue'
import type { ShallowRef } from 'vue'
import { linkEndpointId, useForceSimulation } from '../forceSimulation/useForceSimulation'
import type { ForceLinkDatum, ForceNodeDatum } from '../forceSimulation/useForceSimulation'
import { CLICK_MOVEMENT_THRESHOLD, HOVER_RADIUS_MULTIPLIER } from './nodeGraphConstants'

export interface BaseGraphNode extends ForceNodeDatum {
  baseRadius: number
}

export interface LinkLine {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
}

interface UseNodeGraphOptions<T extends BaseGraphNode> {
  onNodeSelect?: (node: T) => void
}

interface ActiveDrag {
  nodeId: string
  offsetX: number
  offsetY: number
  rectLeft: number
  rectTop: number
  startClientX: number
  startClientY: number
  moved: boolean
}

/**
 * Gives an arbitrary set of nodes physical behavior on a canvas: force-simulated
 * positioning, hover-triggered radius growth, and click-vs-drag pointer interaction.
 * Knows nothing about what a node represents — that's up to the caller.
 */
export function useNodeGraph<T extends BaseGraphNode>(
  nodes: ShallowRef<T[]>,
  links: ShallowRef<ForceLinkDatum[]>,
  options: UseNodeGraphOptions<T> = {},
) {
  const canvasRef = ref<HTMLElement | null>(null)
  const containerSize = ref({ width: 0, height: 0 })

  const { tick, setRadius, startDrag, dragTo, endDrag, sync } = useForceSimulation(nodes, containerSize, links)

  onMounted(() => {
    if (!canvasRef.value) return
    const rect = canvasRef.value.getBoundingClientRect()
    containerSize.value = { width: rect.width, height: rect.height }
  })

  function handleNodeHoverChange(nodeId: string, hovering: boolean) {
    const node = nodes.value.find((n) => n.id === nodeId)
    if (!node) return
    setRadius(nodeId, hovering ? node.baseRadius * HOVER_RADIUS_MULTIPLIER : node.baseRadius)
  }

  function handleNodeSelect(nodeId: string) {
    const node = nodes.value.find((n) => n.id === nodeId)
    if (!node) return
    options.onNodeSelect?.(node)
  }

  function handleNodeResize(nodeId: string, size: { width: number; height: number }) {
    const node = nodes.value.find((n) => n.id === nodeId)
    if (!node || (node.width === size.width && node.height === size.height)) return
    node.width = size.width
    node.height = size.height
    sync()
  }

  let activeDrag: ActiveDrag | null = null

  function handlePointerMove(event: PointerEvent) {
    if (!activeDrag) return

    if (!activeDrag.moved) {
      const dx = event.clientX - activeDrag.startClientX
      const dy = event.clientY - activeDrag.startClientY
      if (Math.hypot(dx, dy) > CLICK_MOVEMENT_THRESHOLD) activeDrag.moved = true
    }

    const x = event.clientX - activeDrag.rectLeft - activeDrag.offsetX
    const y = event.clientY - activeDrag.rectTop - activeDrag.offsetY
    dragTo(activeDrag.nodeId, x, y)
  }

  function handlePointerUp() {
    if (!activeDrag) return
    const { nodeId, moved } = activeDrag
    endDrag(nodeId)
    activeDrag = null
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)

    if (!moved) handleNodeSelect(nodeId)
  }

  function handleNodeDragStart(nodeId: string, event: PointerEvent) {
    const node = nodes.value.find((n) => n.id === nodeId)
    if (!node || !canvasRef.value) return

    const rect = canvasRef.value.getBoundingClientRect()
    activeDrag = {
      nodeId,
      offsetX: event.clientX - rect.left - (node.x ?? 0),
      offsetY: event.clientY - rect.top - (node.y ?? 0),
      rectLeft: rect.left,
      rectTop: rect.top,
      startClientX: event.clientX,
      startClientY: event.clientY,
      moved: false,
    }

    startDrag(nodeId)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  onUnmounted(() => {
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
  })

  function nodeStyle(node: T) {
    void tick.value
    return { transform: `translate3d(${node.x ?? 0}px, ${node.y ?? 0}px, 0)` }
  }

  function linkGeometry(): LinkLine[] {
    void tick.value
    const lines: LinkLine[] = []
    for (const link of links.value) {
      const sourceId = linkEndpointId(link.source)
      const targetId = linkEndpointId(link.target)
      const source = nodes.value.find((n) => n.id === sourceId)
      const target = nodes.value.find((n) => n.id === targetId)
      if (!source || !target) continue
      lines.push({
        id: `${sourceId}-${targetId}`,
        x1: (source.x ?? 0) + source.width / 2,
        y1: (source.y ?? 0) + source.height / 2,
        x2: (target.x ?? 0) + target.width / 2,
        y2: (target.y ?? 0) + target.height / 2,
      })
    }
    return lines
  }

  return {
    canvasRef,
    containerSize,
    tick,
    sync,
    handleNodeHoverChange,
    handleNodeDragStart,
    handleNodeResize,
    nodeStyle,
    linkGeometry,
  }
}
