<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDiscogsStore } from '@/stores/discogs'
import { useDiscogsAuth } from '@/composables/useDiscogsAuth'
import { SearchMode } from '@/types/search'
import type { SearchResult } from '@/types/search'
import { rankResults, rankByPopularity } from '@/utils/relevance'
import { useSearchQuery } from '@/composables/useSearchQuery'
import DetailPanel from '@/components/DetailPanel/DetailPanel.vue'
import AuthPrompt from '@/components/AuthPrompt/AuthPrompt.vue'

const { authenticated } = useDiscogsAuth()

interface DataTableHeader {
  title: string
  key: string
  width?: string
}

const store = useDiscogsStore()
const { searchByCommand } = useSearchQuery()
const rowData = computed(() =>
  store.lastSearchMode === SearchMode.Track
    ? rankResults(store.lastQuery, store.results)
    : rankByPopularity(store.results),
)
const selectedRow = ref<SearchResult | null>(null)

const headers: DataTableHeader[] = [
  { title: 'Title', key: 'title', width: '350px' },
  { title: 'Type', key: 'type' },
  { title: 'Year', key: 'year' },
  { title: 'Country', key: 'country' },
  { title: 'Genre', key: 'genre' },
  { title: 'Style', key: 'style' },
  { title: 'Want', key: 'community.want' },
]

const joinArray = (value: unknown) => (Array.isArray(value) ? value.join(', ') : (value ?? ''))

function onRowClicked(item: SearchResult) {
  selectedRow.value = selectedRow.value?.id === item.id ? null : item
}

function rowProps({ item }: { item: SearchResult }) {
  return { onClick: () => onRowClicked(item) }
}

function onCommandSelect(mode: SearchMode, value: string) {
  selectedRow.value = null
  void searchByCommand(mode, value)
}
</script>

<template>
  <div class="grid-view">
    <AuthPrompt v-if="!authenticated" />

    <template v-else>
      <p v-if="rowData.length === 0" class="grid-view-empty">Run a search to populate the grid.</p>
      <template v-else>
        <div class="grid-view-wrapper">
          <v-data-table
            :items="rowData"
            :headers="headers"
            :row-props="rowProps"
            item-value="id"
            density="compact"
          >
            <template #[`item.genre`]="{ value }">{{ joinArray(value) }}</template>
            <template #[`item.style`]="{ value }">{{ joinArray(value) }}</template>
          </v-data-table>
        </div>
        <DetailPanel
          v-if="selectedRow"
          :result="selectedRow"
          @close="selectedRow = null"
          @command-select="onCommandSelect"
        />
      </template>
    </template>
  </div>
</template>

<style scoped src="./GridView.scss" lang="scss"></style>
