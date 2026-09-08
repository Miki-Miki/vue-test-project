import { SearchMode } from '@/types/search'
import type { SearchResult, SearchSuggestion } from '@/types/search'
import { formatTaxonomyWithVibes, taxonomyFor, toSearchMode, facetKey } from '@/api/taxonomy/taxonomyUtils'
import { MIN_FACETS, MAX_FACETS } from './vibeSearchConstants'

interface RawFacet {
  mode: string
  value: string
}

interface FacetsToolInput {
  facets: RawFacet[]
}

export function buildTaxonomyBlock(): string {
  return [
    `Genres (name: vibe):\n${formatTaxonomyWithVibes(SearchMode.Genre)}`,
    `Styles (name: vibe):\n${formatTaxonomyWithVibes(SearchMode.Style)}`,
  ].join('\n\n')
}

export function parseFacets(input: unknown): SearchSuggestion[] {
  const raw = input as Partial<FacetsToolInput> | undefined
  if (!raw || !Array.isArray(raw.facets) || raw.facets.length < MIN_FACETS || raw.facets.length > MAX_FACETS) {
    throw new Error(`Claude did not return between ${MIN_FACETS} and ${MAX_FACETS} facets`)
  }

  const seen = new Set<string>()
  return raw.facets.map((facet) => {
    const mode = toSearchMode(facet.mode)
    if (!mode || !taxonomyFor(mode).includes(facet.value)) {
      throw new Error(`Claude returned an invalid facet: ${JSON.stringify(facet)}`)
    }
    const parsed: SearchSuggestion = { mode, value: facet.value }
    const key = facetKey(parsed)
    if (seen.has(key)) {
      throw new Error(`Claude returned a duplicate facet: ${JSON.stringify(facet)}`)
    }
    seen.add(key)
    return parsed
  })
}

export function buildRefineUserMessage(
  previousFacets: SearchSuggestion[],
  shownResults: SearchResult[],
  picked: SearchSuggestion,
): string {
  const shownTags = [...new Set(shownResults.flatMap((r) => [...(r.genre ?? []), ...(r.style ?? [])]))]

  return [
    buildTaxonomyBlock(),
    `Previous facets (strong anchor): ${JSON.stringify(previousFacets)}`,
    `Genre/style tags seen in the last shown results (light signal): ${JSON.stringify(shownTags)}`,
    `Picked suggestion (strong signal, must appear in the output): ${JSON.stringify(picked)}`,
  ].join('\n\n')
}
