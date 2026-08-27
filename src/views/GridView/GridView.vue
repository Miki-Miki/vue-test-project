<script setup lang="ts">
import { computed } from 'vue'
import { useDiscogsStore } from '@/stores/discogs'
import { useDiscogsAuth } from '@/composables/useDiscogsAuth'
import { useDetailPanel } from '@/composables/useDetailPanel'
import { SearchMode } from '@/types/search'
import type { SearchResult } from '@/types/search'
import { rankResults, rankByPopularity } from '@/utils/relevance'
import { RESULT_TABLE_HEADERS, joinArrayField } from '@/utils/resultTable'
import AuthPrompt from '@/components/AuthPrompt/AuthPrompt.vue'

const { authenticated } = useDiscogsAuth()

const store = useDiscogsStore()
const { handleDetailPanelToggle } = useDetailPanel()
const rowData = computed(() =>
  store.lastSearchMode === SearchMode.Track
    ? rankResults(store.lastQuery, store.results)
    : rankByPopularity(store.results),
)

const headers = RESULT_TABLE_HEADERS

function handleRowClick(item: SearchResult) {
  handleDetailPanelToggle(item)
}

function rowProps({ item }: { item: SearchResult }) {
  return { onClick: () => handleRowClick(item) }
}
</script>

<template>
  <div class="grid-view">
    <AuthPrompt v-if="!authenticated" />

    <template v-else>
      <p v-if="rowData.length === 0" class="grid-view-empty">Run a search to populate the grid.</p>
      <div v-else class="grid-view-wrapper">
        <v-data-table
          :items="rowData"
          :headers="headers"
          :row-props="rowProps"
          item-value="id"
          density="compact"
        >
          <template #[`item.genre`]="{ value }">{{ joinArrayField(value) }}</template>
          <template #[`item.style`]="{ value }">{{ joinArrayField(value) }}</template>
        </v-data-table>
      </div>
    </template>
  </div>
</template>

<style scoped src="./GridView.scss" lang="scss"></style>
