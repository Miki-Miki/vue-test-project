import { createPinia, setActivePinia } from 'pinia'
import { useDiscogsStore } from '@/stores/discogs'
import { SearchMode } from '@/types/search'
import type { SearchResult, SearchPagination } from '@/types/search'

const pagination: SearchPagination = { per_page: 50, pages: 1, page: 1, items: 1 }
const result: SearchResult = {
  id: 1,
  title: 'Nirvana - Nevermind',
  type: 'release',
  uri: '/Nirvana-Nevermind/release/1',
  resource_url: 'https://api.discogs.com/releases/1',
}

describe('useDiscogsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts empty', () => {
    const store = useDiscogsStore()
    expect(store.results).toEqual([])
    expect(store.pagination).toBeNull()
    expect(store.lastQuery).toBe('')
    expect(store.lastSearchMode).toBe(SearchMode.Track)
  })

  it('setQuery stores the last submitted search query and defaults the mode to track', () => {
    const store = useDiscogsStore()
    store.setQuery('nirvana')
    expect(store.lastQuery).toBe('nirvana')
    expect(store.lastSearchMode).toBe(SearchMode.Track)
  })

  it('setQuery stores an explicit genre mode', () => {
    const store = useDiscogsStore()
    store.setQuery('/genre rock', SearchMode.Genre)
    expect(store.lastQuery).toBe('/genre rock')
    expect(store.lastSearchMode).toBe(SearchMode.Genre)
  })

  it('setQuery stores an explicit style mode', () => {
    const store = useDiscogsStore()
    store.setQuery('/style acid', SearchMode.Style)
    expect(store.lastQuery).toBe('/style acid')
    expect(store.lastSearchMode).toBe(SearchMode.Style)
  })

  it('setResults stores results and pagination', () => {
    const store = useDiscogsStore()
    store.setResults({ results: [result], pagination })
    expect(store.results).toEqual([result])
    expect(store.pagination).toEqual(pagination)
  })

  it('setResults falls back to empty array / null when fields are missing', () => {
    const store = useDiscogsStore()
    store.setResults({} as { results: SearchResult[]; pagination: SearchPagination })
    expect(store.results).toEqual([])
    expect(store.pagination).toBeNull()
  })
})
