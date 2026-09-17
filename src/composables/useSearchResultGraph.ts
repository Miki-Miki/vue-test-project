import { shallowRef, watch } from 'vue'
import type { Ref } from 'vue'
import type { SearchSuggestion } from '@/types/search'
import type { SearchQueryResult } from '@/stores/searchHistory'
import { useNodeGraph } from './useNodeGraph'
import type { ForceLinkDatum } from './useForceSimulation'
import { isResultNode, makeResultNode } from './searchResultGraphUtils'
import type { GraphNode, ResultGraphNode, SuggestionGraphNode } from './searchResultGraphUtils'
import {
  NODE_SPAWN_OFFSET_X,
  SUGGESTION_NODE_HEIGHT,
  SUGGESTION_NODE_RADIUS,
  SUGGESTION_NODE_WIDTH,
  SUGGESTION_STACK_OFFSET_Y,
} from './searchResultGraphConstants'

export type { GraphNode, ResultGraphNode, SuggestionGraphNode }

interface UseSearchResultGraphOptions {
  activeSearches: Ref<SearchQueryResult[] | undefined>
  suggestions: Ref<SearchSuggestion[]>
  refreshSuggestionsFor: (history: string[]) => Promise<void>
  onResultNodeSelect: (searchId: string) => void
  onSuggestionSelect: (suggestion: SearchSuggestion) => void
}

export function useSearchResultGraph(options: UseSearchResultGraphOptions) {
  const graphNodes = shallowRef<GraphNode[]>([])
  const graphLinks = shallowRef<ForceLinkDatum[]>([])

  const { canvasRef, containerSize, sync, handleNodeHoverChange, handleNodeDragStart, nodeStyle } = useNodeGraph(
    graphNodes,
    graphLinks,
    {
      onNodeSelect: (node) => {
        if (!isResultNode(node)) return
        options.onResultNodeSelect(node.searchId)
      },
    },
  )

  function spawnResultNodes(newSearches: SearchQueryResult[]): ResultGraphNode[] {
    const priorResultNodes = graphNodes.value.filter(isResultNode)
    const lastPrior = priorResultNodes[priorResultNodes.length - 1]
    let anchor = lastPrior
      ? { x: lastPrior.x ?? 0, y: lastPrior.y ?? 0 }
      : {
          x: containerSize.value.width / 2 - NODE_SPAWN_OFFSET_X,
          y: containerSize.value.height / 2,
        }

    const spawned: ResultGraphNode[] = []
    for (const search of newSearches) {
      const node = makeResultNode(search, anchor)
      spawned.push(node)
      anchor = { x: node.x ?? 0, y: node.y ?? 0 }
    }
    return spawned
  }

  async function refreshSuggestionsForNode(node: ResultGraphNode): Promise<void> {
    const searches = options.activeSearches.value
    if (!searches) return

    await options.refreshSuggestionsFor(searches.map((s) => s.query))

    const suggestionNodes: SuggestionGraphNode[] = options.suggestions.value.map((suggestion, i) => ({
      id: `suggestion-${node.searchId}-${i}`,
      kind: 'suggestion',
      suggestion,
      baseRadius: SUGGESTION_NODE_RADIUS,
      radius: SUGGESTION_NODE_RADIUS,
      width: SUGGESTION_NODE_WIDTH,
      height: SUGGESTION_NODE_HEIGHT,
      x: (node.x ?? 0) + node.width,
      y: (node.y ?? 0) + i * SUGGESTION_STACK_OFFSET_Y,
    }))

    graphNodes.value = [...graphNodes.value.filter(isResultNode), ...suggestionNodes]
    graphLinks.value = suggestionNodes.map((s) => ({ source: s.id, target: node.id }))
    sync()
  }

  watch(
    () => options.activeSearches.value,
    (searches) => {
      if (!searches || searches.length === 0) return

      const existingSearchIds = new Set(graphNodes.value.filter(isResultNode).map((n) => n.searchId))
      const newSearches = searches.filter((s) => !existingSearchIds.has(s.id))
      if (newSearches.length === 0) return

      const spawned = spawnResultNodes(newSearches)
      graphNodes.value = [...graphNodes.value.filter(isResultNode), ...spawned]
      graphLinks.value = []
      sync()

      void refreshSuggestionsForNode(spawned[spawned.length - 1]!)
    },
    { immediate: true },
  )

  function handleSuggestionSelect(node: SuggestionGraphNode) {
    options.onSuggestionSelect(node.suggestion)
  }

  return {
    canvasRef,
    graphNodes,
    nodeStyle,
    handleNodeHoverChange,
    handleNodeDragStart,
    handleSuggestionSelect,
  }
}
