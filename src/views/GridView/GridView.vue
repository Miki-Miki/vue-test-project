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
import type { DiscogsResult } from '@/stores/discogs'
import { rankResults } from '@/utils/relevance'
import DetailPanel from '@/components/DetailPanel/DetailPanel.vue'

ModuleRegistry.registerModules([AllCommunityModule])

const store = useDiscogsStore()
const rowData = computed(() => rankResults(store.lastQuery, store.results))
const selectedRow = ref<DiscogsResult | null>(null)

const joinArray = (params: ValueFormatterParams) =>
  Array.isArray(params.value) ? params.value.join(', ') : (params.value ?? '')

const colDefs: ColDef<DiscogsResult>[] = [
  { field: 'title', width: 350 },
  { field: 'type' },
  { field: 'year' },
  { field: 'country' },
  { field: 'genre', valueFormatter: joinArray },
  { field: 'style', valueFormatter: joinArray },
  {
    headerName: 'Want',
    valueGetter: (params: ValueGetterParams<DiscogsResult>) => params.data?.community?.want,
  },
]

function onRowClicked(event: RowClickedEvent<DiscogsResult>) {
  selectedRow.value = selectedRow.value?.id === event.data?.id ? null : (event.data ?? null)
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
      />
    </template>
  </div>
</template>

<style scoped src="./GridView.scss" lang="scss"></style>
