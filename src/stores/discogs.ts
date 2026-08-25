import { ref } from 'vue'
import { defineStore } from 'pinia'
import { SearchMode } from '@/types/search'
import type { SearchResult, SearchPagination } from '@/types/search'

export const useDiscogsStore = defineStore('discogs', () => {
  const results = ref<SearchResult[]>([])
  const pagination = ref<SearchPagination | null>(null)
  const lastQuery = ref('')
  const lastSearchMode = ref<SearchMode>(SearchMode.Track)

  function setResults(data: { results: SearchResult[]; pagination: SearchPagination }) {
    results.value = data.results ?? []
    pagination.value = data.pagination ?? null
  }

  function setQuery(query: string, mode: SearchMode = SearchMode.Track) {
    lastQuery.value = query
    lastSearchMode.value = mode
  }

  return { results, pagination, lastQuery, lastSearchMode, setResults, setQuery }
})
