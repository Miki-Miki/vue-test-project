import { shallowRef, onScopeDispose, watch } from 'vue'
import type { Ref, ShallowRef } from 'vue'
import type { ForceCollide, ForceLink, Simulation } from 'd3-force'
import { clampToContainer, createForceSimulation, linkEndpointId } from './forceSimulationUtils'
import type { ForceLinkDatum, ForceNodeDatum } from './forceSimulationUtils'
import {
  FORCE_BOUNDARY_PADDING,
  FORCE_DRAG_ALPHA_TARGET,
  FORCE_RESTART_ALPHA,
} from './forceSimulationConstants'

export type { ForceNodeDatum, ForceLinkDatum }
export { linkEndpointId }

export function useForceSimulation<T extends ForceNodeDatum>(
  nodes: ShallowRef<T[]>,
  containerSize: Ref<{ width: number; height: number }>,
  links: ShallowRef<ForceLinkDatum[]>,
) {
  const tick = shallowRef(0)
  let simulation: Simulation<T, ForceLinkDatum> | undefined

  function clampNodeToContainer(node: T) {
    const clamped = clampToContainer(
      node.x ?? 0,
      node.y ?? 0,
      FORCE_BOUNDARY_PADDING,
      containerSize.value.width,
      containerSize.value.height,
    )
    node.x = clamped.x
    node.y = clamped.y
  }

  watch(
    containerSize,
    ({ width, height }) => {
      if (simulation || width === 0 || height === 0) return

      simulation = createForceSimulation(nodes.value, links.value)
      simulation.on('tick', () => {
        for (const node of nodes.value) clampNodeToContainer(node)
        tick.value++
      })
    },
    { immediate: true },
  )

  function setRadius(id: string, radius: number) {
    const node = nodes.value.find((n) => n.id === id)
    if (!node) return
    node.radius = radius

    // forceCollide caches each node's radius at initialize() time and never re-reads it —
    // calling its own .radius() setter again is what forces it to recompute from the live values.
    const collideForce = simulation?.force('collide') as ForceCollide<T> | undefined
    collideForce?.radius((d) => d.radius)

    simulation?.alpha(FORCE_RESTART_ALPHA).restart()
  }

  function startDrag(id: string) {
    const node = nodes.value.find((n) => n.id === id)
    if (!node) return
    node.fx = node.x
    node.fy = node.y
    simulation?.alphaTarget(FORCE_DRAG_ALPHA_TARGET).restart()
  }

  function dragTo(id: string, x: number, y: number) {
    const node = nodes.value.find((n) => n.id === id)
    if (!node) return
    const clamped = clampToContainer(
      x,
      y,
      FORCE_BOUNDARY_PADDING,
      containerSize.value.width,
      containerSize.value.height,
    )
    node.fx = clamped.x
    node.fy = clamped.y
  }

  function endDrag(id: string) {
    const node = nodes.value.find((n) => n.id === id)
    if (!node) return
    node.fx = null
    node.fy = null
    simulation?.alphaTarget(0)
  }

  /**
   * Call after reassigning nodes.value/links.value (adding/removing nodes or links at
   * runtime). simulation.nodes() is d3's own "the node list changed" API — it re-runs
   * every registered force's initialize(), refreshing forceCollide's cached radii and
   * forceLink's resolved endpoints, while preserving x/y/vx/vy for nodes that were
   * already present.
   */
  function sync() {
    if (!simulation) return
    simulation.nodes(nodes.value)
    const linkForce = simulation.force('link') as ForceLink<T, ForceLinkDatum> | undefined
    linkForce?.links(links.value)
    simulation.alpha(FORCE_RESTART_ALPHA).restart()
  }

  onScopeDispose(() => simulation?.stop())

  return { tick, setRadius, startDrag, dragTo, endDrag, sync }
}
