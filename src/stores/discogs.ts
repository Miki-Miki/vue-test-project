import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface DiscogsResult {
  id: number
  title: string
  type: string
  year?: string
  country?: string
  genre?: string[]
  style?: string[]
  format?: string[]
  label?: string[]
  catno?: string
  thumb?: string
  uri: string
  resource_url: string
  community?: {
    want: number
    have: number
  }
}

export interface DiscogsPagination {
  per_page: number
  pages: number
  page: number
  items: number
}

export const useDiscogsStore = defineStore('discogs', () => {
  const results = ref<DiscogsResult[]>([])
  const pagination = ref<DiscogsPagination | null>(null)
  const lastQuery = ref('')

  function setResults(data: { results: DiscogsResult[]; pagination: DiscogsPagination }) {
    results.value = data.results ?? []
    pagination.value = data.pagination ?? null
  }

  function setQuery(query: string) {
    lastQuery.value = query
  }

  return { results, pagination, lastQuery, setResults, setQuery }
})
