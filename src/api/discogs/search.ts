import { SearchMode } from '@/types/search'
import type { SearchResult, SearchPagination } from '@/types/search'
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

export const discogsSearchApi: Record<SearchMode, (term: string) => Promise<DiscogsResponse<RawSearchData>>> = {
  [SearchMode.Track]: searchTracks,
  [SearchMode.Genre]: searchByGenre,
  [SearchMode.Style]: searchByStyle,
}
