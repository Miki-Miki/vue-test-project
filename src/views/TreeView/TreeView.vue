<script setup lang="ts">
import { computed } from 'vue'
import { useSearchHistoryStore } from '@/stores/searchHistory'
import { useDiscogsAuth } from '@/composables/useDiscogsAuth'
import { useDetailPanel } from '@/composables/useDetailPanel'
import type { SearchResult } from '@/types/search'
import { rankByPopularity } from '@/utils/relevance'
import ResultsScrollCard from '@/components/ResultsScrollCard/ResultsScrollCard.vue'
import AuthPrompt from '@/components/AuthPrompt/AuthPrompt.vue'
import SuggestionPicker from '@/components/SuggestionPicker/SuggestionPicker.vue'

const TOP_N = 10

const { authenticated } = useDiscogsAuth()
const historyStore = useSearchHistoryStore()
const { handleDetailPanelToggle } = useDetailPanel()

const activeSession = computed(() =>
  historyStore.sessions.find((s) => s.id === historyStore.activeSessionId),
)

const cards = computed(
  () =>
    activeSession.value?.searches.map((search) => ({
      id: search.id,
      query: search.query,
      results: rankByPopularity(search.results).slice(0, TOP_N),
    })) ?? [],
)

function handleResultSelect(result: SearchResult) {
  handleDetailPanelToggle(result)
}

function handleOnWheel(event: WheelEvent) {
  if (event.deltaY === 0) return
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).scrollLeft += event.deltaY
}
</script>

<template>
  <div class="tree-view">
    <AuthPrompt v-if="!authenticated" />

    <template v-else>
      <p v-if="cards.length === 0" class="tree-view-empty">
        Search a style, genre, or song to start exploring.
      </p>
      <div v-else class="tree-view-wrapper" @wheel="handleOnWheel">
        <div class="tree-view-stack">
          <ResultsScrollCard
            class="tree-view-stack-item"
            v-for="card in cards"
            :key="card.id"
            :query="card.query"
            :results="card.results"
            @select="handleResultSelect"
          />

          <SuggestionPicker class="tree-view-stack-item" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped src="./TreeView.scss" lang="scss"></style>
