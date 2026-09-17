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

// d3's forceLink mutates each link's source/target in place, replacing the id string with the
// resolved node object once the simulation initializes — callers reading a live link must
// handle both states, even though ForceLinkDatum's own type only describes how one is authored.
export function linkEndpointId(ref: string | { id: string }): string {
  return typeof ref === 'string' ? ref : ref.id
}

export function clampToContainer(
  x: number,
  y: number,
  padding: number,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: Math.min(Math.max(x, padding), width - padding),
    y: Math.min(Math.max(y, padding), height - padding),
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
