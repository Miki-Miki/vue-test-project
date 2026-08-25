<script setup lang="ts">
import { computed, ref } from 'vue'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import type {
  ColDef,
  ValueFormatterParams,
  ValueGetterParams,
  RowClickedEvent,
} from 'ag-grid-community'
import { AgGridVue } from 'ag-grid-vue3'
import { useDiscogsStore } from '@/stores/discogs'
import { SearchMode } from '@/types/search'
import type { SearchResult } from '@/types/search'
import { rankResults, rankByPopularity } from '@/utils/relevance'
import { useSearchQuery } from '@/composables/useSearchQuery'
import DetailPanel from '@/components/DetailPanel/DetailPanel.vue'

ModuleRegistry.registerModules([AllCommunityModule])

const store = useDiscogsStore()
const { searchByCommand } = useSearchQuery()
const rowData = computed(() =>
  store.lastSearchMode === SearchMode.Track
    ? rankResults(store.lastQuery, store.results)
    : rankByPopularity(store.results),
)
const selectedRow = ref<SearchResult | null>(null)

const joinArray = (params: ValueFormatterParams) =>
  Array.isArray(params.value) ? params.value.join(', ') : (params.value ?? '')

const colDefs: ColDef<SearchResult>[] = [
  { field: 'title', width: 350 },
  { field: 'type' },
  { field: 'year' },
  { field: 'country' },
  { field: 'genre', valueFormatter: joinArray },
  { field: 'style', valueFormatter: joinArray },
  {
    headerName: 'Want',
    valueGetter: (params: ValueGetterParams<SearchResult>) => params.data?.community?.want,
  },
]

function onRowClicked(event: RowClickedEvent<SearchResult>) {
  selectedRow.value = selectedRow.value?.id === event.data?.id ? null : (event.data ?? null)
}

function onCommandSelect(mode: SearchMode, value: string) {
  selectedRow.value = null
  void searchByCommand(mode, value)
}
</script>

<template>
  <div class="grid-view">
    <p v-if="rowData.length === 0" class="grid-view-empty">Run a search to populate the grid.</p>
    <template v-else>
      <div class="grid-view-wrapper">
        <AgGridVue
          :rowData="rowData"
          :columnDefs="colDefs"
          style="width: 100%; height: 100%"
          @row-clicked="onRowClicked"
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

<style scoped src="./GridView.scss" lang="scss"></style>
