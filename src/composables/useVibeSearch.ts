import { ref } from 'vue'
import { SearchMode } from '@/types/search'
import type { SearchResult, SearchSuggestion } from '@/types/search'
import { useDiscogsStore } from '@/stores/discogs'
import { useSearchHistoryStore } from '@/stores/searchHistory'
import { formatCommand } from '@/utils/searchCommand'
import { rankByPopularity } from '@/utils/relevance'
import { searchByFacets } from '@/api/discogs'
import { generateVibeSearch, refineVibeSearch } from '@/api/vibeSearch'

const TOP_N = 10

const facets = ref<SearchSuggestion[]>([])
const results = ref<SearchResult[]>([])
const loading = ref(false)
const error = ref('')

function applyVibeResults(query: string, top10: SearchResult[]): void {
  const data = {
    results: top10,
    pagination: { per_page: TOP_N, pages: 1, page: 1, items: top10.length },
  }

  const store = useDiscogsStore()
  const historyStore = useSearchHistoryStore()
  store.setResults(data)
  store.setQuery(query, SearchMode.Vibe)

  if (window.location.pathname === '/tree') {
    historyStore.appendSearch(query, data)
  } else {
    historyStore.addEntry(query, data)
  }
}

async function runVibeFacets(query: string, newFacets: SearchSuggestion[]): Promise<void> {
  const merged = await searchByFacets(newFacets)
  const top10 = rankByPopularity(merged).slice(0, TOP_N)
  facets.value = newFacets
  results.value = top10
  applyVibeResults(query, top10)
}

async function startVibeSearch(prompt: string): Promise<void> {
  loading.value = true
  error.value = ''

  try {
    const newFacets = await generateVibeSearch(prompt)
    await runVibeFacets(formatCommand(SearchMode.Vibe, prompt), newFacets)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An unknown error occurred'
  } finally {
    loading.value = false
  }
}

async function pickSuggestion(picked: SearchSuggestion): Promise<void> {
  loading.value = true
  error.value = ''

  try {
    const newFacets = await refineVibeSearch(facets.value, results.value, picked)
    await runVibeFacets(formatCommand(picked.mode, picked.value), newFacets)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An unknown error occurred'
  } finally {
    loading.value = false
  }
}

export function useVibeSearch() {
  return { facets, results, loading, error, startVibeSearch, pickSuggestion }
}
