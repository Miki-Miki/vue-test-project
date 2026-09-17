import { onMounted, onUnmounted, ref } from 'vue'
import type { ShallowRef } from 'vue'
import { linkEndpointId, useForceSimulation } from '../forceSimulation/useForceSimulation'
import type { ForceLinkDatum, ForceNodeDatum } from '../forceSimulation/useForceSimulation'
import {
  CLICK_MOVEMENT_THRESHOLD,
  HOVER_RADIUS_MULTIPLIER,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_SENSITIVITY,
} from './nodeGraphConstants'

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

interface ActiveCanvasPan {
  startClientX: number
  startClientY: number
  startPanX: number
  startPanY: number
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
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
  const zoom = ref(1)
  // screen-space offset (px) applied before scaling; re-anchored on every wheel tick
  // so the point under the cursor is what zooms in/out toward, not the canvas center
  const pan = ref({ x: 0, y: 0 })
  const isSpaceHeld = ref(false)
  const isPanningCanvas = ref(false)

  const { tick, setRadius, startDrag, dragTo, endDrag, sync } = useForceSimulation(nodes, containerSize, links)

  onMounted(() => {
    if (!canvasRef.value) return
    const rect = canvasRef.value.getBoundingClientRect()
    containerSize.value = { width: rect.width, height: rect.height }
  })

  function handleSpaceKeyDown(event: KeyboardEvent) {
    if (event.code !== 'Space' || isTypingTarget(event.target)) return
    event.preventDefault()
    isSpaceHeld.value = true
  }

  function handleSpaceKeyUp(event: KeyboardEvent) {
    if (event.code !== 'Space') return
    isSpaceHeld.value = false
  }

  function canvasCursor(): string {
    if (isPanningCanvas.value) return 'grabbing'
    if (isSpaceHeld.value) return 'grab'
    return ''
  }

  let activeCanvasPan: ActiveCanvasPan | null = null

  function handleCanvasPanMove(event: PointerEvent) {
    if (!activeCanvasPan) return
    pan.value = {
      x: activeCanvasPan.startPanX + (event.clientX - activeCanvasPan.startClientX),
      y: activeCanvasPan.startPanY + (event.clientY - activeCanvasPan.startClientY),
    }
  }

  function handleCanvasPanEnd() {
    activeCanvasPan = null
    isPanningCanvas.value = false
    window.removeEventListener('pointermove', handleCanvasPanMove)
    window.removeEventListener('pointerup', handleCanvasPanEnd)
  }

  function handleCanvasPanStart(event: PointerEvent) {
    if (!isSpaceHeld.value || event.button !== 0) return
    event.preventDefault()
    activeCanvasPan = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPanX: pan.value.x,
      startPanY: pan.value.y,
    }
    isPanningCanvas.value = true
    window.addEventListener('pointermove', handleCanvasPanMove)
    window.addEventListener('pointerup', handleCanvasPanEnd)
  }

  onMounted(() => {
    window.addEventListener('keydown', handleSpaceKeyDown)
    window.addEventListener('keyup', handleSpaceKeyUp)
  })

  function handleCanvasZoom(event: WheelEvent) {
    if (!canvasRef.value) return
    const rect = canvasRef.value.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    const factor = 1 - event.deltaY * ZOOM_SENSITIVITY
    const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom.value * factor))
    const scaleRatio = newZoom / zoom.value

    // keeps the simulation point currently under the cursor fixed on screen:
    // pan' = mouse - (mouse - pan) * (newZoom / zoom)
    pan.value = {
      x: mouseX - (mouseX - pan.value.x) * scaleRatio,
      y: mouseY - (mouseY - pan.value.y) * scaleRatio,
    }
    zoom.value = newZoom
  }

  function contentStyle() {
    return {
      transform: `translate(${pan.value.x}px, ${pan.value.y}px) scale(${zoom.value})`,
      transformOrigin: '0 0',
    }
  }

  // screen coordinates have to be un-panned and un-scaled to land back in the
  // simulation's untransformed coordinate space
  function toSimSpace(clientX: number, clientY: number, rectLeft: number, rectTop: number) {
    return {
      x: (clientX - rectLeft - pan.value.x) / zoom.value,
      y: (clientY - rectTop - pan.value.y) / zoom.value,
    }
  }

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

    const { x: simX, y: simY } = toSimSpace(
      event.clientX,
      event.clientY,
      activeDrag.rectLeft,
      activeDrag.rectTop,
    )
    dragTo(activeDrag.nodeId, simX - activeDrag.offsetX, simY - activeDrag.offsetY)
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
    if (isSpaceHeld.value) return
    const node = nodes.value.find((n) => n.id === nodeId)
    if (!node || !canvasRef.value) return

    const rect = canvasRef.value.getBoundingClientRect()
    const { x: simX, y: simY } = toSimSpace(event.clientX, event.clientY, rect.left, rect.top)
    activeDrag = {
      nodeId,
      offsetX: simX - (node.x ?? 0),
      offsetY: simY - (node.y ?? 0),
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
    window.removeEventListener('pointermove', handleCanvasPanMove)
    window.removeEventListener('pointerup', handleCanvasPanEnd)
    window.removeEventListener('keydown', handleSpaceKeyDown)
    window.removeEventListener('keyup', handleSpaceKeyUp)
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
    handleCanvasZoom,
    handleCanvasPanStart,
    canvasCursor,
    nodeStyle,
    contentStyle,
    linkGeometry,
  }
}
