export enum SearchMode {
  Track = 'track',
  Genre = 'genre',
  Style = 'style',
  Vibe = 'vibe',
}

export interface SearchResult {
  id: number
  title: string
  type: string
  year?: string
  country?: string
  genre?: string[]
  style?: string[]
  format?: string[]
  label?: string[]
  catno?: string
  thumb?: string
  uri: string
  resource_url: string
  community?: {
    want: number
    have: number
  }
}

export interface SearchPagination {
  per_page: number
  pages: number
  page: number
  items: number
}

export interface SearchSuggestion {
  mode: SearchMode
  value: string
}
