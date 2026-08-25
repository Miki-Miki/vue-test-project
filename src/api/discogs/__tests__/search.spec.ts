import { SearchMode } from '@/types/search'
import { searchTracks, searchByGenre, searchByStyle, discogsSearchApi } from '@/api/discogs/search'

function jsonResponse(body: unknown, ok = true, status = 200, statusText = 'OK') {
  return { ok, status, statusText, json: () => Promise.resolve(body) }
}

describe('discogs search API', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({ results: [], pagination: {} }))
  })

  it('searchTracks builds a track search URL', async () => {
    await searchTracks('nirvana')
    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?track=nirvana')
  })

  it('searchByGenre builds a genre search URL scoped to releases', async () => {
    await searchByGenre('rock')
    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?genre=rock&type=release')
  })

  it('searchByStyle builds a style search URL scoped to releases', async () => {
    await searchByStyle('acid')
    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?style=acid&type=release')
  })

  it('URL-encodes a multi-word term as %20', async () => {
    await searchByGenre('hip hop')
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/discogs/database/search?genre=hip%20hop&type=release',
    )

    await searchByStyle('new beat')
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/discogs/database/search?style=new%20beat&type=release',
    )
  })

  it('discogsSearchApi maps every SearchMode to its matching function', () => {
    expect(discogsSearchApi[SearchMode.Track]).toBe(searchTracks)
    expect(discogsSearchApi[SearchMode.Genre]).toBe(searchByGenre)
    expect(discogsSearchApi[SearchMode.Style]).toBe(searchByStyle)
  })
})
