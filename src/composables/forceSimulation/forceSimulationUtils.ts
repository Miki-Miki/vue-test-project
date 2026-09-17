import { forceSimulation, forceCollide, forceManyBody, forceLink } from 'd3-force'
import type { Simulation, SimulationNodeDatum } from 'd3-force'
import {
  FORCE_ATTRACTION_STRENGTH,
  FORCE_COLLIDE_STRENGTH,
  FORCE_LINK_DISTANCE,
  FORCE_LINK_STRENGTH,
  FORCE_VELOCITY_DECAY,
} from './forceSimulationConstants'

export interface ForceNodeDatum extends SimulationNodeDatum {
  id: string
  radius: number
  width: number
  height: number
}

export interface ForceLinkDatum {
  source: string
  target: string
}

export function clampToContainer(
  x: number,
  y: number,
  halfWidth: number,
  halfHeight: number,
  padding: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const marginX = halfWidth + padding
  const marginY = halfHeight + padding
  return {
    x: Math.min(Math.max(x, marginX), width - marginX),
    y: Math.min(Math.max(y, marginY), height - marginY),
  }
}

export function createForceSimulation<T extends ForceNodeDatum>(
  nodes: T[],
  links: ForceLinkDatum[],
): Simulation<T, ForceLinkDatum> {
  return forceSimulation<T, ForceLinkDatum>(nodes)
    .force('attraction', forceManyBody().strength(FORCE_ATTRACTION_STRENGTH))
    .force('collide', forceCollide<T>((d) => d.radius).strength(FORCE_COLLIDE_STRENGTH))
    .force(
      'link',
      forceLink<T, ForceLinkDatum>(links)
        .id((d) => d.id)
        .distance(FORCE_LINK_DISTANCE)
        .strength(FORCE_LINK_STRENGTH),
    )
    .velocityDecay(FORCE_VELOCITY_DECAY)
}
