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
    expect(store.entries).toEqual([])
    expect(store.activeEntryId).toBeNull()
  })

  it('restores entries from localStorage on init', () => {
    const seeded = [{ id: 'abc', query: 'floyd', timestamp: 1, results: [], pagination: null }]
    window.localStorage.setItem('discogs:search-history', JSON.stringify(seeded))

    const store = useSearchHistoryStore()
    expect(store.entries).toEqual(seeded)
    expect(store.activeEntryId).toBe('abc')
  })

  it('addEntry prepends a new entry, sets it active, and persists to localStorage', () => {
    mockSequentialNow()
    const store = useSearchHistoryStore()

    store.addEntry('nirvana', { results, pagination })

    expect(store.entries).toHaveLength(1)
    expect(store.entries[0]).toMatchObject({ query: 'nirvana', results, pagination })
    expect(store.activeEntryId).toBe(store.entries[0]!.id)

    const persisted = JSON.parse(window.localStorage.getItem('discogs:search-history')!)
    expect(persisted).toEqual(store.entries)
  })

  it('caps history at 10 entries, dropping the oldest', () => {
    mockSequentialNow()
    const store = useSearchHistoryStore()

    for (let i = 0; i < 11; i++) {
      store.addEntry(`query-${i}`, { results, pagination })
    }

    expect(store.entries).toHaveLength(10)
    expect(store.entries[0]!.query).toBe('query-10')
    expect(store.entries.some((e) => e.query === 'query-0')).toBe(false)
  })

  it('setActiveEntry updates activeEntryId and pushes the entry into the discogs store', () => {
    mockSequentialNow()
    const store = useSearchHistoryStore()
    store.addEntry('first', { results, pagination })
    const firstId = store.entries[0]!.id

    store.addEntry('second', { results: [], pagination })
    expect(store.activeEntryId).not.toBe(firstId)

    store.setActiveEntry(firstId)

    expect(store.activeEntryId).toBe(firstId)
    const discogsStore = useDiscogsStore()
    expect(discogsStore.results).toEqual(results)
    expect(discogsStore.pagination).toEqual(pagination)
    expect(discogsStore.lastQuery).toBe('first')
    expect(discogsStore.lastSearchMode).toBe(SearchMode.Track)
  })

  it('setActiveEntry restores genre-search mode for a /genre entry', () => {
    mockSequentialNow()
    const store = useSearchHistoryStore()
    store.addEntry('/genre rock', { results, pagination })
    const genreId = store.entries[0]!.id

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
    const styleId = store.entries[0]!.id

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
    const activeBefore = store.activeEntryId

    store.setActiveEntry('does-not-exist')

    expect(store.activeEntryId).toBe(activeBefore)
  })

  it('clearHistory resets state, removes from localStorage, and clears the discogs store', () => {
    mockSequentialNow()
    const store = useSearchHistoryStore()
    store.addEntry('first', { results, pagination })

    store.clearHistory()

    expect(store.entries).toEqual([])
    expect(store.activeEntryId).toBeNull()
    expect(window.localStorage.getItem('discogs:search-history')).toBeNull()

    const discogsStore = useDiscogsStore()
    expect(discogsStore.results).toEqual([])
  })
})
