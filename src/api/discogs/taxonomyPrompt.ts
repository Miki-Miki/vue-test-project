import { SearchMode } from '@/types/search'
import { DISCOGS_GENRES, DISCOGS_STYLES } from '@/data/discogsTaxonomy'
import { GENRE_VIBES, STYLE_VIBES } from '@/data/discogsTaxonomyVibes'

/** Genre/style are the only taxonomy-backed modes a Claude prompt ever picks from. */
export type TaxonomyMode = SearchMode.Genre | SearchMode.Style

export function taxonomyFor(mode: TaxonomyMode): readonly string[] {
  return mode === SearchMode.Genre ? DISCOGS_GENRES : DISCOGS_STYLES
}

function vibesFor(mode: TaxonomyMode): Record<string, string> {
  return mode === SearchMode.Genre ? GENRE_VIBES : STYLE_VIBES
}

export function toSearchMode(mode: string): TaxonomyMode | null {
  return mode === 'genre' ? SearchMode.Genre : mode === 'style' ? SearchMode.Style : null
}

/** One line per taxonomy value: `"Ambient: Slow-moving, atmospheric, textural..."`. */
export function formatTaxonomyWithVibes(mode: TaxonomyMode): string {
  const vibes = vibesFor(mode)
  return taxonomyFor(mode)
    .map((value) => `${value}: ${vibes[value] ?? ''}`)
    .join('\n')
}

export function facetKey(facet: { mode: SearchMode; value: string }): string {
  return `${facet.mode}:${facet.value}`
}
