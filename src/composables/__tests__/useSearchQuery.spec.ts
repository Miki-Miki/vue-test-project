import { createPinia, setActivePinia } from 'pinia'
import { useSearchQuery } from '@/composables/useSearchQuery'
import { useDiscogsStore } from '@/stores/discogs'
import { useSearchHistoryStore } from '@/stores/searchHistory'
import { SearchMode } from '@/types/search'

function jsonResponse(body: unknown, ok = true, status = 200, statusText = 'OK') {
  return { ok, status, statusText, json: () => Promise.resolve(body) }
}

describe('useSearchQuery', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActivePinia(createPinia())
    global.fetch = jest.fn()
    useSearchQuery().reset()
  })

  it('does nothing when the query is empty or whitespace', async () => {
    const { query, search, error } = useSearchQuery()
    query.value = '   '
    await search()
    expect(global.fetch).not.toHaveBeenCalled()
    expect(error.value).toBe('')
  })

  it('builds a track search URL for ordinary input', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ results: [], pagination: { per_page: 0, pages: 0, page: 1, items: 0 } }),
    )
    const { query, search } = useSearchQuery()
    query.value = 'nirvana'
    await search()

    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?track=nirvana')
    expect(useDiscogsStore().lastSearchMode).toBe(SearchMode.Track)
  })

  it('builds a genre search URL for a /genre command and records genre mode', async () => {
    const data = { results: [{ id: 1, title: 'x' }], pagination: { per_page: 1, pages: 1, page: 1, items: 1 } }
    ;(global.fetch as jest.Mock).mockResolvedValue(jsonResponse(data))
    const { query, search } = useSearchQuery()
    query.value = '/genre rock'
    await search()

    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?genre=rock&type=release')
    expect(useDiscogsStore().results).toEqual(data.results)
    expect(useDiscogsStore().lastQuery).toBe('/genre rock')
    expect(useDiscogsStore().lastSearchMode).toBe(SearchMode.Genre)
    expect(useSearchHistoryStore().sessions[0]?.searches[0]?.query).toBe('/genre rock')
  })

  it('builds a style search URL for a /style command and records style mode', async () => {
    const data = { results: [{ id: 2, title: 'y' }], pagination: { per_page: 1, pages: 1, page: 1, items: 1 } }
    ;(global.fetch as jest.Mock).mockResolvedValue(jsonResponse(data))
    const { query, search } = useSearchQuery()
    query.value = '/style acid'
    await search()

    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?style=acid&type=release')
    expect(useDiscogsStore().results).toEqual(data.results)
    expect(useDiscogsStore().lastQuery).toBe('/style acid')
    expect(useDiscogsStore().lastSearchMode).toBe(SearchMode.Style)
  })

  it('searchByCommand formats the command, updates query, and searches (genre)', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ results: [], pagination: { per_page: 0, pages: 0, page: 1, items: 0 } }),
    )
    const { query, searchByCommand } = useSearchQuery()
    await searchByCommand(SearchMode.Genre, 'Hip Hop')

    expect(query.value).toBe('/genre "Hip Hop"')
    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?genre=Hip%20Hop&type=release')
  })

  it('searchByCommand formats the command, updates query, and searches (style)', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ results: [], pagination: { per_page: 0, pages: 0, page: 1, items: 0 } }),
    )
    const { query, searchByCommand } = useSearchQuery()
    await searchByCommand(SearchMode.Style, 'New Beat')

    expect(query.value).toBe('/style "New Beat"')
    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?style=New%20Beat&type=release')
  })

  it('sets a usage error for a bare /genre command without hitting the network', async () => {
    const { query, search, error } = useSearchQuery()
    query.value = '/genre'
    await search()

    expect(global.fetch).not.toHaveBeenCalled()
    expect(error.value).toBe('Usage: /genre <genre> (e.g. /genre rock)')
  })

  it('sets a usage error for a bare /style command without hitting the network', async () => {
    const { query, search, error } = useSearchQuery()
    query.value = '/style'
    await search()

    expect(global.fetch).not.toHaveBeenCalled()
    expect(error.value).toBe('Usage: /style <style> (e.g. /style acid)')
  })

  it('shows an HTTP error message when the response is not ok', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(jsonResponse({}, false, 401, 'Unauthorized'))
    const { query, search, error } = useSearchQuery()
    query.value = 'nirvana'
    await search()

    expect(error.value).toBe('HTTP 401: Unauthorized')
  })

  it('shows the exception message when fetch throws', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('network down'))
    const { query, search, error } = useSearchQuery()
    query.value = 'nirvana'
    await search()

    expect(error.value).toBe('network down')
  })

  it('toggles loading around the request', async () => {
    let resolveFetch!: (v: unknown) => void
    ;(global.fetch as jest.Mock).mockReturnValue(new Promise((resolve) => (resolveFetch = resolve)))
    const { query, loading, search } = useSearchQuery()
    query.value = 'nirvana'
    const promise = search()

    await Promise.resolve()
    expect(loading.value).toBe(true)

    resolveFetch(jsonResponse({ results: [], pagination: { per_page: 0, pages: 0, page: 1, items: 0 } }))
    await promise

    expect(loading.value).toBe(false)
  })

  it('suggestions is empty for a plain track search', () => {
    const { query, suggestions } = useSearchQuery()
    query.value = 'nirvana'

    expect(suggestions.value).toEqual([])
  })

  it('suggestions filters the genre list by the in-progress term', () => {
    const { query, suggestions } = useSearchQuery()
    query.value = '/genre ro'

    expect(suggestions.value).toContain('Rock')
    expect(suggestions.value.every((g) => g.toLowerCase().includes('ro'))).toBe(true)
  })

  it('suggestions returns the full genre list for a bare /genre command', () => {
    const { query, suggestions } = useSearchQuery()
    query.value = '/genre'

    expect(suggestions.value.length).toBeGreaterThan(1)
  })

  it('suggestions filters the style list by the in-progress term', () => {
    const { query, suggestions } = useSearchQuery()
    query.value = '/style aci'

    expect(suggestions.value).toContain('Acid')
    expect(suggestions.value.every((s) => s.toLowerCase().includes('aci'))).toBe(true)
  })

  it('selectSuggestion runs a search using the current command mode', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ results: [], pagination: { per_page: 0, pages: 0, page: 1, items: 0 } }),
    )
    const { query, selectSuggestion } = useSearchQuery()
    query.value = '/genre ro'
    await selectSuggestion('Rock')

    expect(query.value).toBe('/genre Rock')
    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?genre=Rock&type=release')
    expect(useDiscogsStore().lastSearchMode).toBe(SearchMode.Genre)
  })

  it('reset clears query, loading, and error', () => {
    const state = useSearchQuery()
    state.query.value = 'nirvana'
    state.error.value = 'boom'
    state.reset()

    expect(state.query.value).toBe('')
    expect(state.loading.value).toBe(false)
    expect(state.error.value).toBe('')
  })
})
