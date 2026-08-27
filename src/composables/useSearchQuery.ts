import { computed, ref } from 'vue'
import { SearchMode } from '@/types/search'
import { useDiscogsStore } from '@/stores/discogs'
import { useSearchHistoryStore } from '@/stores/searchHistory'
import { discogsSearchApi } from '@/api/discogs'
import { parseSearchCommand, formatCommand, SEARCH_COMMANDS } from '@/utils/searchCommand'
import { DISCOGS_GENRES, DISCOGS_STYLES } from '@/data/discogsTaxonomy'
import { useVibeSearch } from '@/composables/useVibeSearch'

const SUGGESTION_LIMIT = 20

const query = ref('')
const loading = ref(false)
const error = ref('')

function taxonomyFor(mode: SearchMode): readonly string[] {
  switch (mode) {
    case SearchMode.Genre:
      return DISCOGS_GENRES
    case SearchMode.Style:
      return DISCOGS_STYLES
    default:
      return []
  }
}

/**
 * Suggestions only appear once a full `/genre`/`/style` keyword has been
 * typed (parseSearchCommand requires an exact keyword match) — this mirrors
 * the search bar's existing command syntax rather than introducing a new one.
 */
const suggestions = computed(() => {
  const parsed = parseSearchCommand(query.value)
  const pool = taxonomyFor(parsed.mode)
  if (!pool.length) return []

  const needle = parsed.term.toLowerCase()
  const matches = needle ? pool.filter((value) => value.toLowerCase().includes(needle)) : pool

  return matches.slice(0, SUGGESTION_LIMIT)
})

function usageMessage(mode: SearchMode): string {
  const command = SEARCH_COMMANDS.find((c) => c.mode === mode)
  return command ? `Usage: ${command.keyword} <${command.label.toLowerCase()}> (e.g. ${command.example})` : ''
}

async function search(): Promise<void> {
  const parsed = parseSearchCommand(query.value)

  if (!parsed.term) {
    if (parsed.mode !== SearchMode.Track && parsed.raw) {
      error.value = usageMessage(parsed.mode)
    }
    return
  }

  loading.value = true
  error.value = ''

  if (parsed.mode === SearchMode.Vibe) {
    const vibeSearch = useVibeSearch()
    await vibeSearch.startVibeSearch(parsed.term)
    error.value = vibeSearch.error.value
    loading.value = false
    return
  }

  try {
    const response = await discogsSearchApi[parsed.mode](parsed.term)

    if (response.ok) {
      const store = useDiscogsStore()
      const historyStore = useSearchHistoryStore()
      store.setResults(response.data)
      store.setQuery(parsed.raw, parsed.mode)
      if (window.location.pathname === '/tree') {
        historyStore.appendSearch(parsed.raw, response.data)
      } else {
        historyStore.addEntry(parsed.raw, response.data)
      }
    } else {
      error.value = `HTTP ${response.status}: ${response.statusText}`
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An unknown error occurred'
  } finally {
    loading.value = false
  }
}

async function searchByCommand(mode: SearchMode, value: string): Promise<void> {
  query.value = formatCommand(mode, value)
  await search()
}

async function selectSuggestion(value: string): Promise<void> {
  const parsed = parseSearchCommand(query.value)
  await searchByCommand(parsed.mode, value)
}

function reset(): void {
  query.value = ''
  loading.value = false
  error.value = ''
}

export function useSearchQuery() {
  return { query, loading, error, search, searchByCommand, suggestions, selectSuggestion, reset }
}
