import type { SearchResult, SearchSuggestion } from '@/types/search'
import type { SearchQueryResult } from '@/stores/searchHistory'
import type { BaseGraphNode } from '../nodeGraph/useNodeGraph'
import { NODE_BASE_RADIUS, NODE_HEIGHT, NODE_SPAWN_JITTER_Y, NODE_SPAWN_OFFSET_X, NODE_WIDTH } from './searchResultGraphConstants'

export interface ResultGraphNode extends BaseGraphNode {
  kind: 'result'
  searchId: string
  query: string
  results: SearchResult[]
}

export interface SuggestionGraphNode extends BaseGraphNode {
  kind: 'suggestion'
  suggestion: SearchSuggestion
}

export type GraphNode = ResultGraphNode | SuggestionGraphNode

export function isResultNode(node: GraphNode): node is ResultGraphNode {
  return node.kind === 'result'
}

export function makeResultNode(
  search: SearchQueryResult,
  anchor: { x: number; y: number },
): ResultGraphNode {
  return {
    id: `result-${search.id}`,
    kind: 'result',
    searchId: search.id,
    query: search.query,
    results: search.results,
    baseRadius: NODE_BASE_RADIUS,
    radius: NODE_BASE_RADIUS,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    x: anchor.x + NODE_SPAWN_OFFSET_X,
    y: anchor.y + (Math.random() - 0.5) * NODE_SPAWN_JITTER_Y,
  }
}
