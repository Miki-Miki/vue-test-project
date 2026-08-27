<script setup lang="ts">
import { computed, watch } from 'vue'
import { useSearchHistoryStore } from '@/stores/searchHistory'
import { useDiscogsAuth } from '@/composables/useDiscogsAuth'
import { useDetailPanel } from '@/composables/useDetailPanel'
import { useSearchQuery } from '@/composables/useSearchQuery'
import { useSearchSuggestions } from '@/composables/useSearchSuggestions'
import type { SearchMode, SearchResult } from '@/types/search'
import { rankByPopularity } from '@/utils/relevance'
import ResultsScrollCard from '@/components/ResultsScrollCard/ResultsScrollCard.vue'
import AuthPrompt from '@/components/AuthPrompt/AuthPrompt.vue'
import SuggestionPicker from '@/components/SuggestionPicker/SuggestionPicker.vue'

const TOP_N = 10

const { authenticated } = useDiscogsAuth()
const historyStore = useSearchHistoryStore()
const { handleDetailPanelToggle } = useDetailPanel()
const { searchByCommand } = useSearchQuery()
const {
  suggestions,
  loading: suggestionsLoading,
  error: suggestionsError,
  refresh: refreshSuggestions,
} = useSearchSuggestions()

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

const searchHistoryQueries = computed(() => activeSession.value?.searches.map((s) => s.query) ?? [])

watch(
  searchHistoryQueries,
  (history) => {
    if (history.length) void refreshSuggestions(history)
  },
  { immediate: true },
)

function handleResultSelect(result: SearchResult) {
  handleDetailPanelToggle(result)
}

function handleSuggestionSelect(mode: SearchMode, value: string) {
  void searchByCommand(mode, value)
}

function handleSuggestionsRetry() {
  void refreshSuggestions(searchHistoryQueries.value)
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

          <SuggestionPicker
            class="tree-view-stack-item"
            :suggestions="suggestions"
            :loading="suggestionsLoading"
            :error="suggestionsError"
            @select="handleSuggestionSelect"
            @retry="handleSuggestionsRetry"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped src="./TreeView.scss" lang="scss"></style>
