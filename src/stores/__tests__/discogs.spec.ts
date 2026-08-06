import { createPinia, setActivePinia } from 'pinia'
import { useDiscogsStore } from '@/stores/discogs'
import type { DiscogsResult, DiscogsPagination } from '@/stores/discogs'

const pagination: DiscogsPagination = { per_page: 50, pages: 1, page: 1, items: 1 }
const result: DiscogsResult = {
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
  })

  it('setResults stores results and pagination', () => {
    const store = useDiscogsStore()
    store.setResults({ results: [result], pagination })
    expect(store.results).toEqual([result])
    expect(store.pagination).toEqual(pagination)
  })

  it('setResults falls back to empty array / null when fields are missing', () => {
    const store = useDiscogsStore()
    store.setResults({} as { results: DiscogsResult[]; pagination: DiscogsPagination })
    expect(store.results).toEqual([])
    expect(store.pagination).toBeNull()
  })
})
