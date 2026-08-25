import { createPinia, setActivePinia } from 'pinia'
import { useSearchHistoryStore } from '@/stores/searchHistory'
import { useDiscogsStore } from '@/stores/discogs'
import { SearchMode } from '@/types/search'
import type { SearchResult, SearchPagination } from '@/types/search'

const pagination: SearchPagination = { per_page: 50, pages: 1, page: 1, items: 1 }
const results: SearchResult[] = [
  {
    id: 1,
    title: 'Nirvana - Nevermind',
    type: 'release',
    uri: '/Nirvana-Nevermind/release/1',
    resource_url: 'https://api.discogs.com/releases/1',
  },
]

function mockSequentialNow(startingAt = 1_000) {
  let current = startingAt
  jest.spyOn(Date, 'now').mockImplementation(() => ++current)
}

describe('useSearchHistoryStore', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts empty when nothing is in localStorage', () => {
    const store = useSearchHistoryStore()
    expect(store.sessions).toEqual([])
    expect(store.activeSessionId).toBeNull()
  })

  it('restores sessions from localStorage on init', () => {
    const seeded = [
      {
        id: 'abc',
        timestamp: 1,
        searches: [{ id: 'abc', query: 'floyd', timestamp: 1, results: [], pagination: null }],
      },
    ]
    window.localStorage.setItem('discogs:search-history', JSON.stringify(seeded))

    const store = useSearchHistoryStore()
    expect(store.sessions).toEqual(seeded)
    expect(store.activeSessionId).toBe('abc')
  })

  it('migrates legacy flat entries (pre-session shape) into single-search sessions', () => {
    const legacy = [{ id: 'abc', query: 'floyd', timestamp: 1, results: [], pagination: null }]
    window.localStorage.setItem('discogs:search-history', JSON.stringify(legacy))

    const store = useSearchHistoryStore()
    expect(store.sessions).toEqual([
      { id: 'abc', timestamp: 1, searches: [{ id: 'abc', query: 'floyd', timestamp: 1, results: [], pagination: null }] },
    ])
    expect(store.activeSessionId).toBe('abc')
  })

  it('addEntry prepends a new session wrapping one search, sets it active, and persists to localStorage', () => {
    mockSequentialNow()
    const store = useSearchHistoryStore()

    store.addEntry('nirvana', { results, pagination })

    expect(store.sessions).toHaveLength(1)
    expect(store.sessions[0]!.searches).toHaveLength(1)
    expect(store.sessions[0]!.searches[0]).toMatchObject({ query: 'nirvana', results, pagination })
    expect(store.activeSessionId).toBe(store.sessions[0]!.id)

    const persisted = JSON.parse(window.localStorage.getItem('discogs:search-history')!)
    expect(persisted).toEqual(store.sessions)
  })

  it('caps history at 10 sessions, dropping the oldest', () => {
    mockSequentialNow()
    const store = useSearchHistoryStore()

    for (let i = 0; i < 11; i++) {
      store.addEntry(`query-${i}`, { results, pagination })
    }

    expect(store.sessions).toHaveLength(10)
    expect(store.sessions[0]!.searches[0]!.query).toBe('query-10')
    expect(store.sessions.some((s) => s.searches[0]!.query === 'query-0')).toBe(false)
  })

  it('appendSearch adds a search onto the active session instead of creating a new one', () => {
    mockSequentialNow()
    const store = useSearchHistoryStore()
    store.addEntry('rock', { results, pagination })
    const sessionId = store.sessions[0]!.id

    store.appendSearch('jazz', { results: [], pagination })

    expect(store.sessions).toHaveLength(1)
    expect(store.sessions[0]!.id).toBe(sessionId)
    expect(store.sessions[0]!.searches).toHaveLength(2)
    expect(store.sessions[0]!.searches[1]).toMatchObject({ query: 'jazz', results: [] })

    const persisted = JSON.parse(window.localStorage.getItem('discogs:search-history')!)
    expect(persisted).toEqual(store.sessions)
  })

  it('appendSearch creates a new session when there is no active session', () => {
    mockSequentialNow()
    const store = useSearchHistoryStore()

    store.appendSearch('jazz', { results, pagination })

    expect(store.sessions).toHaveLength(1)
    expect(store.sessions[0]!.searches).toHaveLength(1)
    expect(store.sessions[0]!.searches[0]).toMatchObject({ query: 'jazz', results, pagination })
    expect(store.activeSessionId).toBe(store.sessions[0]!.id)
  })

  it('setActiveEntry updates activeSessionId and pushes the last search into the discogs store', () => {
    mockSequentialNow()
    const store = useSearchHistoryStore()
    store.addEntry('first', { results, pagination })
    const firstId = store.sessions[0]!.id

    store.addEntry('second', { results: [], pagination })
    expect(store.activeSessionId).not.toBe(firstId)

    store.setActiveEntry(firstId)

    expect(store.activeSessionId).toBe(firstId)
    const discogsStore = useDiscogsStore()
    expect(discogsStore.results).toEqual(results)
    expect(discogsStore.pagination).toEqual(pagination)
    expect(discogsStore.lastQuery).toBe('first')
    expect(discogsStore.lastSearchMode).toBe(SearchMode.Track)
  })

  it('setActiveEntry restores the most recent search when a session has more than one', () => {
    mockSequentialNow()
    const store = useSearchHistoryStore()
    store.addEntry('rock', { results, pagination })
    const sessionId = store.sessions[0]!.id
    store.appendSearch('/genre jazz', { results: [], pagination })

    store.addEntry('unrelated', { results, pagination })
    store.setActiveEntry(sessionId)

    const discogsStore = useDiscogsStore()
    expect(discogsStore.lastQuery).toBe('/genre jazz')
    expect(discogsStore.lastSearchMode).toBe(SearchMode.Genre)
  })

  it('setActiveEntry restores genre-search mode for a /genre entry', () => {
    mockSequentialNow()
    const store = useSearchHistoryStore()
    store.addEntry('/genre rock', { results, pagination })
    const genreId = store.sessions[0]!.id

    store.addEntry('second', { results: [], pagination })
    store.setActiveEntry(genreId)

    const discogsStore = useDiscogsStore()
    expect(discogsStore.lastQuery).toBe('/genre rock')
    expect(discogsStore.lastSearchMode).toBe(SearchMode.Genre)
  })

  it('setActiveEntry restores style-search mode for a /style entry', () => {
    mockSequentialNow()
    const store = useSearchHistoryStore()
    store.addEntry('/style acid', { results, pagination })
    const styleId = store.sessions[0]!.id

    store.addEntry('second', { results: [], pagination })
    store.setActiveEntry(styleId)

    const discogsStore = useDiscogsStore()
    expect(discogsStore.lastQuery).toBe('/style acid')
    expect(discogsStore.lastSearchMode).toBe(SearchMode.Style)
  })

  it('setActiveEntry is a no-op for an unknown id', () => {
    mockSequentialNow()
    const store = useSearchHistoryStore()
    store.addEntry('first', { results, pagination })
    const activeBefore = store.activeSessionId

    store.setActiveEntry('does-not-exist')

    expect(store.activeSessionId).toBe(activeBefore)
  })

  it('clearHistory resets state, removes from localStorage, and clears the discogs store', () => {
    mockSequentialNow()
    const store = useSearchHistoryStore()
    store.addEntry('first', { results, pagination })

    store.clearHistory()

    expect(store.sessions).toEqual([])
    expect(store.activeSessionId).toBeNull()
    expect(window.localStorage.getItem('discogs:search-history')).toBeNull()

    const discogsStore = useDiscogsStore()
    expect(discogsStore.results).toEqual([])
  })
})
