import { ref } from 'vue'
import { defineStore } from 'pinia'
import { lsGet, lsSet, lsRemove } from '@/utils/localStorage'
import type { SearchResult, SearchPagination } from '@/types/search'
import { useDiscogsStore } from '@/stores/discogs'
import { parseSearchCommand } from '@/utils/searchCommand'

const STORAGE_KEY = 'search-history'
const MAX_ENTRIES = 10

export interface SearchEntry {
  id: string
  query: string
  timestamp: number
  results: SearchResult[]
  pagination: SearchPagination | null
}

export const useSearchHistoryStore = defineStore('searchHistory', () => {
  const entries = ref<SearchEntry[]>(lsGet<SearchEntry[]>(STORAGE_KEY) ?? [])
  const activeEntryId = ref<string | null>(entries.value[0]?.id ?? null)

  function addEntry(
    query: string,
    data: { results: SearchResult[]; pagination: SearchPagination },
  ): void {
    const entry: SearchEntry = {
      id: Date.now().toString(),
      query,
      timestamp: Date.now(),
      results: data.results ?? [],
      pagination: data.pagination ?? null,
    }
    entries.value = [entry, ...entries.value].slice(0, MAX_ENTRIES)
    activeEntryId.value = entry.id
    lsSet(STORAGE_KEY, entries.value)
  }

  function setActiveEntry(id: string): void {
    const entry = entries.value.find((e) => e.id === id)
    if (!entry) return
    activeEntryId.value = id
    const discogsStore = useDiscogsStore()
    discogsStore.setResults({
      results: entry.results,
      pagination: entry.pagination ?? { per_page: 0, pages: 0, page: 1, items: 0 },
    })
    discogsStore.setQuery(entry.query, parseSearchCommand(entry.query).mode)
  }

  function clearHistory(): void {
    entries.value = []
    activeEntryId.value = null
    lsRemove(STORAGE_KEY)
    const discogsStore = useDiscogsStore()
    discogsStore.setResults({
      results: [],
      pagination: { per_page: 0, pages: 0, page: 1, items: 0 },
    })
  }

  return { entries, activeEntryId, addEntry, setActiveEntry, clearHistory }
})
