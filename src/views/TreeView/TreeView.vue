<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { SearchResult, SearchSuggestion } from '@/types/search'
import { useSearchHistoryStore } from '@/stores/searchHistory'
import type { SearchQueryResult } from '@/stores/searchHistory'
import { useSearchSuggestions } from '@/composables/useSearchSuggestions'
import { useSearchQuery } from '@/composables/useSearchQuery'
import { useForceSimulation } from '@/composables/useForceSimulation'
import type { ForceLinkDatum, ForceNodeDatum } from '@/composables/useForceSimulation'
import ResultsNode from '@/components/ResultsNode/ResultsNode.vue'
import SuggestionNode from '@/components/SuggestionNode/SuggestionNode.vue'

const NODE_BASE_RADIUS = 80
const HOVER_RADIUS_MULTIPLIER = 1.25

// must match the rendered card size in ResultsNode.scss — used only for the container boundary clamp, not collision
const NODE_WIDTH = 150
const NODE_HEIGHT = 120

// must match the rendered pill size in SuggestionNode.scss
const SUGGESTION_NODE_RADIUS = 28
const SUGGESTION_NODE_WIDTH = 90
const SUGGESTION_NODE_HEIGHT = 40
const SUGGESTION_STACK_OFFSET_Y = 50

// where a freshly spawned result node is seeded relative to the previous newest node
const NODE_SPAWN_OFFSET_X = 220
const NODE_SPAWN_JITTER_Y = 60

// pointer movement (px) below which a pointerup on a ResultsNode counts as a click, not a drag
const CLICK_MOVEMENT_THRESHOLD = 4

interface ResultGraphNode extends ForceNodeDatum {
  kind: 'result'
  searchId: string
  query: string
  results: SearchResult[]
  baseRadius: number
}

interface SuggestionGraphNode extends ForceNodeDatum {
  kind: 'suggestion'
  suggestion: SearchSuggestion
  baseRadius: number
}

type GraphNode = ResultGraphNode | SuggestionGraphNode

function isResultNode(node: GraphNode): node is ResultGraphNode {
  return node.kind === 'result'
}

const router = useRouter()
const historyStore = useSearchHistoryStore()
const { suggestions, refresh: refreshSuggestions } = useSearchSuggestions()
const { searchByCommand } = useSearchQuery()

const activeSession = computed(
  () => historyStore.sessions.find((s) => s.id === historyStore.activeSessionId) ?? null,
)

const graphNodes = shallowRef<GraphNode[]>([])
const graphLinks = shallowRef<ForceLinkDatum[]>([])

const canvasRef = ref<HTMLElement | null>(null)
const containerSize = ref({ width: 0, height: 0 })

const { tick, setRadius, startDrag, dragTo, endDrag, sync } = useForceSimulation(
  graphNodes,
  containerSize,
  graphLinks,
)

onMounted(() => {
  if (!canvasRef.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  containerSize.value = { width: rect.width, height: rect.height }
})

function makeResultNode(search: SearchQueryResult, anchor: { x: number; y: number }): ResultGraphNode {
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

function spawnResultNodes(newSearches: SearchQueryResult[]): ResultGraphNode[] {
  const priorResultNodes = graphNodes.value.filter(isResultNode)
  const lastPrior = priorResultNodes[priorResultNodes.length - 1]
  let anchor = lastPrior
    ? { x: lastPrior.x ?? 0, y: lastPrior.y ?? 0 }
    : { x: containerSize.value.width / 2 - NODE_SPAWN_OFFSET_X, y: containerSize.value.height / 2 }

  const spawned: ResultGraphNode[] = []
  for (const search of newSearches) {
    const node = makeResultNode(search, anchor)
    spawned.push(node)
    anchor = { x: node.x ?? 0, y: node.y ?? 0 }
  }
  return spawned
}

async function refreshSuggestionsFor(node: ResultGraphNode): Promise<void> {
  const session = activeSession.value
  if (!session) return

  await refreshSuggestions(session.searches.map((s) => s.query))

  const suggestionNodes: SuggestionGraphNode[] = suggestions.value.map((suggestion, i) => ({
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
  () => activeSession.value?.searches,
  (searches) => {
    if (!searches || searches.length === 0) return

    const existingSearchIds = new Set(graphNodes.value.filter(isResultNode).map((n) => n.searchId))
    const newSearches = searches.filter((s) => !existingSearchIds.has(s.id))
    if (newSearches.length === 0) return

    const spawned = spawnResultNodes(newSearches)
    graphNodes.value = [...graphNodes.value.filter(isResultNode), ...spawned]
    graphLinks.value = []
    sync()

    void refreshSuggestionsFor(spawned[spawned.length - 1]!)
  },
  { immediate: true },
)

function handleNodeHoverChange(nodeId: string, hovering: boolean) {
  const node = graphNodes.value.find((n) => n.id === nodeId)
  if (!node) return
  setRadius(nodeId, hovering ? node.baseRadius * HOVER_RADIUS_MULTIPLIER : node.baseRadius)
}

function handleNodeSelect(nodeId: string) {
  const node = graphNodes.value.find((n) => n.id === nodeId)
  if (!node || !isResultNode(node) || !historyStore.activeSessionId) return
  historyStore.setActiveEntry(historyStore.activeSessionId, node.searchId)
  void router.push({ name: 'grid' })
}

function handleSuggestionSelect(node: SuggestionGraphNode) {
  void searchByCommand(node.suggestion.mode, node.suggestion.value)
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
  const node = graphNodes.value.find((n) => n.id === nodeId)
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

function nodeStyle(node: GraphNode) {
  void tick.value
  return { transform: `translate3d(${node.x ?? 0}px, ${node.y ?? 0}px, 0)` }
}
</script>

<template>
  <div class="tree-view">
    <div ref="canvasRef" class="tree-view-canvas">
      <div
        v-for="node in graphNodes"
        :key="node.id"
        class="tree-view-canvas-node"
        :style="nodeStyle(node)"
      >
        <ResultsNode
          v-if="node.kind === 'result'"
          :query="node.query"
          :results="node.results"
          @hover-change="handleNodeHoverChange(node.id, $event)"
          @drag-start="handleNodeDragStart(node.id, $event)"
        />
        <SuggestionNode
          v-else
          :suggestion="node.suggestion"
          @hover-change="handleNodeHoverChange(node.id, $event)"
          @select="handleSuggestionSelect(node)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped src="./TreeView.scss" lang="scss"></style>
