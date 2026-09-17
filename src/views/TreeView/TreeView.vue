<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSearchHistoryStore } from '@/stores/searchHistory'
import { useSearchSuggestions } from '@/composables/useSearchSuggestions'
import { useSearchQuery } from '@/composables/useSearchQuery'
import { useSearchResultGraph } from '@/composables/useSearchResultGraph'
import ResultsNode from '@/components/ResultsNode/ResultsNode.vue'
import SuggestionNode from '@/components/SuggestionNode/SuggestionNode.vue'

const router = useRouter()
const historyStore = useSearchHistoryStore()
const { suggestions, refresh: refreshSuggestions } = useSearchSuggestions()
const { searchByCommand } = useSearchQuery()

const activeSession = computed(
  () => historyStore.sessions.find((s) => s.id === historyStore.activeSessionId) ?? null,
)
const activeSearches = computed(() => activeSession.value?.searches)

const { canvasRef, graphNodes, nodeStyle, handleNodeHoverChange, handleNodeDragStart, handleSuggestionSelect } =
  useSearchResultGraph({
    activeSearches,
    suggestions,
    refreshSuggestionsFor: refreshSuggestions,
    onResultNodeSelect: (searchId) => {
      if (!historyStore.activeSessionId) return
      historyStore.setActiveEntry(historyStore.activeSessionId, searchId)
      void router.push({ name: 'grid' })
    },
    onSuggestionSelect: (suggestion) => {
      void searchByCommand(suggestion.mode, suggestion.value)
    },
  })
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
