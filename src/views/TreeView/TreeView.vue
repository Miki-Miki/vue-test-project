<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSearchHistoryStore } from '@/stores/searchHistory'
import { SearchMode } from '@/types/search'
import type { SearchResult } from '@/types/search'
import { rankByPopularity } from '@/utils/relevance'
import { useSearchQuery } from '@/composables/useSearchQuery'
import ResultsScrollCard from '@/components/ResultsScrollCard/ResultsScrollCard.vue'
import DetailPanel from '@/components/DetailPanel/DetailPanel.vue'

const TOP_N = 10

const historyStore = useSearchHistoryStore()
const { searchByCommand } = useSearchQuery()

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

const selectedRow = ref<SearchResult | null>(null)

function onSelect(result: SearchResult) {
  selectedRow.value = selectedRow.value?.id === result.id ? null : result
}

function onCommandSelect(mode: SearchMode, value: string) {
  selectedRow.value = null
  void searchByCommand(mode, value)
}
</script>

<template>
  <div class="tree-view">
    <p v-if="cards.length === 0" class="tree-view-empty">
      Search a style, genre, or song to start exploring.
    </p>
    <template v-else>
      <div class="tree-view-stack">
        <ResultsScrollCard
          v-for="card in cards"
          :key="card.id"
          :query="card.query"
          :results="card.results"
          @select="onSelect"
        />
      </div>
      <DetailPanel
        v-if="selectedRow"
        :result="selectedRow"
        @close="selectedRow = null"
        @command-select="onCommandSelect"
      />
    </template>
  </div>
</template>

<style scoped src="./TreeView.scss" lang="scss"></style>
