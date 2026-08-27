import { SearchMode } from '@/types/search'
import type { SearchResult, SearchPagination, SearchSuggestion } from '@/types/search'
import { discogsRequest } from './client'
import type { DiscogsResponse } from './client'

export interface RawSearchData {
  results: SearchResult[]
  pagination: SearchPagination
}

export function searchTracks(term: string): Promise<DiscogsResponse<RawSearchData>> {
  return discogsRequest(`/api/discogs/database/search?track=${encodeURIComponent(term)}`)
}

export function searchByGenre(term: string): Promise<DiscogsResponse<RawSearchData>> {
  return discogsRequest(
    `/api/discogs/database/search?genre=${encodeURIComponent(term)}&type=release`,
  )
}

export function searchByStyle(term: string): Promise<DiscogsResponse<RawSearchData>> {
  return discogsRequest(
    `/api/discogs/database/search?style=${encodeURIComponent(term)}&type=release`,
  )
}

function searchByVibe(): Promise<DiscogsResponse<RawSearchData>> {
  throw new Error('Vibe search is orchestrated by useVibeSearch, not discogsSearchApi')
}

export const discogsSearchApi: Record<SearchMode, (term: string) => Promise<DiscogsResponse<RawSearchData>>> = {
  [SearchMode.Track]: searchTracks,
  [SearchMode.Genre]: searchByGenre,
  [SearchMode.Style]: searchByStyle,
  [SearchMode.Vibe]: searchByVibe,
}

/**
 * Discogs' /database/search only accepts a single genre= or style= value per
 * request — there's no combined multi-facet query. This fans out one request
 * per facet in parallel and merges the results client-side, deduped by id.
 */
export async function searchByFacets(facets: SearchSuggestion[]): Promise<SearchResult[]> {
  const responses = await Promise.all(facets.map((facet) => discogsSearchApi[facet.mode](facet.value)))

  const merged = new Map<number, SearchResult>()
  for (const response of responses) {
    if (!response.ok) continue
    for (const result of response.data.results ?? []) {
      merged.set(result.id, result)
    }
  }

  return [...merged.values()]
}
