import { ref } from 'vue'
import { defineStore } from 'pinia'
import { lsGet, lsSet, lsRemove } from '@/utils/localStorage'
import type { SearchResult, SearchPagination } from '@/types/search'
import { useDiscogsStore } from '@/stores/discogs'
import { parseSearchCommand } from '@/utils/searchCommand'

const STORAGE_KEY = 'search-history'
const MAX_ENTRIES = 10

export interface SearchQueryResult {
  id: string
  query: string
  timestamp: number
  results: SearchResult[]
  pagination: SearchPagination | null
}

export interface SearchSession {
  id: string
  timestamp: number
  searches: SearchQueryResult[]
}

/** Old, pre-session shape — one flat search per history entry. */
interface LegacySearchEntry {
  id: string
  query: string
  timestamp: number
  results: SearchResult[]
  pagination: SearchPagination | null
}

function isLegacyShape(value: unknown): value is LegacySearchEntry[] {
  return Array.isArray(value) && value.length > 0 && !('searches' in (value[0] as object))
}

function migrateLegacyEntries(legacy: LegacySearchEntry[]): SearchSession[] {
  return legacy.map((entry) => ({
    id: entry.id,
    timestamp: entry.timestamp,
    searches: [
      {
        id: entry.id,
        query: entry.query,
        timestamp: entry.timestamp,
        results: entry.results,
        pagination: entry.pagination,
      },
    ],
  }))
}

function loadSessions(): SearchSession[] {
  const stored = lsGet<SearchSession[] | LegacySearchEntry[]>(STORAGE_KEY) ?? []
  return isLegacyShape(stored) ? migrateLegacyEntries(stored) : (stored as SearchSession[])
}

export const useSearchHistoryStore = defineStore('searchHistory', () => {
  const sessions = ref<SearchSession[]>(loadSessions())
  const activeSessionId = ref<string | null>(sessions.value[0]?.id ?? null)
  const activeSearchId = ref<string | null>(
    sessions.value[0]?.searches[sessions.value[0].searches.length - 1]?.id ?? null,
  )

  function buildSearch(
    query: string,
    data: { results: SearchResult[]; pagination: SearchPagination },
  ): SearchQueryResult {
    return {
      id: Date.now().toString(),
      query,
      timestamp: Date.now(),
      results: data.results ?? [],
      pagination: data.pagination ?? null,
    }
  }

  function addEntry(
    query: string,
    data: { results: SearchResult[]; pagination: SearchPagination },
  ): void {
    const search = buildSearch(query, data)
    const session: SearchSession = { id: search.id, timestamp: search.timestamp, searches: [search] }
    sessions.value = [session, ...sessions.value].slice(0, MAX_ENTRIES)
    activeSessionId.value = session.id
    activeSearchId.value = search.id
    lsSet(STORAGE_KEY, sessions.value)
  }

  function appendSearch(
    query: string,
    data: { results: SearchResult[]; pagination: SearchPagination },
  ): void {
    const activeSession = sessions.value.find((s) => s.id === activeSessionId.value)
    if (!activeSession) {
      addEntry(query, data)
      return
    }

    const search = buildSearch(query, data)
    activeSession.searches = [...activeSession.searches, search]
    sessions.value = [...sessions.value]
    activeSearchId.value = search.id
    lsSet(STORAGE_KEY, sessions.value)
  }

  function setActiveEntry(id: string, searchId?: string): void {
    const session = sessions.value.find((s) => s.id === id)
    if (!session) return

    const targetSearch = searchId
      ? session.searches.find((s) => s.id === searchId)
      : session.searches[session.searches.length - 1]
    if (!targetSearch) return

    activeSessionId.value = id
    activeSearchId.value = targetSearch.id

    const discogsStore = useDiscogsStore()
    discogsStore.setResults({
      results: targetSearch.results,
      pagination: targetSearch.pagination ?? { per_page: 0, pages: 0, page: 1, items: 0 },
    })
    discogsStore.setQuery(targetSearch.query, parseSearchCommand(targetSearch.query).mode)
  }

  function startNewSession(): void {
    activeSessionId.value = null
    activeSearchId.value = null
    const discogsStore = useDiscogsStore()
    discogsStore.setResults({
      results: [],
      pagination: { per_page: 0, pages: 0, page: 1, items: 0 },
    })
    discogsStore.setQuery('')
  }

  function clearHistory(): void {
    sessions.value = []
    activeSessionId.value = null
    activeSearchId.value = null
    lsRemove(STORAGE_KEY)
    const discogsStore = useDiscogsStore()
    discogsStore.setResults({
      results: [],
      pagination: { per_page: 0, pages: 0, page: 1, items: 0 },
    })
  }

  return {
    sessions,
    activeSessionId,
    activeSearchId,
    addEntry,
    appendSearch,
    setActiveEntry,
    startNewSession,
    clearHistory,
  }
})
