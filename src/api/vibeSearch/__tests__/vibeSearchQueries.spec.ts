import { generateVibeSearch, refineVibeSearch } from '@/api/vibeSearch/vibeSearchQueries'
import { SearchMode } from '@/types/search'
import type { SearchResult, SearchSuggestion } from '@/types/search'
import { DISCOGS_GENRES, DISCOGS_STYLES } from '@/data/discogsTaxonomy'

function mockFetchOnce(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as typeof fetch
}

function toolUseResponse(name: string, facets: Array<{ mode: string; value: string }>) {
  return {
    content: [{ type: 'tool_use', id: 'toolu_1', name, input: { facets } }],
  }
}

function makeResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    id: 1,
    title: 'Some Release',
    type: 'release',
    uri: '/release/1',
    resource_url: 'https://api.discogs.com/releases/1',
    ...overrides,
  }
}

describe('generateVibeSearch', () => {
  it('maps a valid tool_use response into SearchSuggestion[]', async () => {
    const style = DISCOGS_STYLES[0]!
    const style2 = DISCOGS_STYLES[1]!
    mockFetchOnce(
      200,
      toolUseResponse('select_vibe_facets', [
        { mode: 'style', value: style },
        { mode: 'style', value: style2 },
      ]),
    )

    const result = await generateVibeSearch('rainy sunday morning')

    expect(result).toEqual([
      { mode: SearchMode.Style, value: style },
      { mode: SearchMode.Style, value: style2 },
    ])
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/claude/messages',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('rejects when a facet value is not in the taxonomy', async () => {
    mockFetchOnce(
      200,
      toolUseResponse('select_vibe_facets', [
        { mode: 'style', value: 'Not A Real Style' },
        { mode: 'style', value: DISCOGS_STYLES[0]! },
      ]),
    )

    await expect(generateVibeSearch('rainy sunday morning')).rejects.toThrow('invalid facet')
  })

  it('rejects when the response has no tool_use content block', async () => {
    mockFetchOnce(200, { content: [{ type: 'text', text: 'no thanks' }] })

    await expect(generateVibeSearch('rainy sunday morning')).rejects.toThrow(
      'did not call select_vibe_facets',
    )
  })

  it('rejects with the proxy error message on a non-OK response', async () => {
    mockFetchOnce(500, { error: 'Claude API error: rate limited' })

    await expect(generateVibeSearch('rainy sunday morning')).rejects.toThrow('rate limited')
  })
})

describe('refineVibeSearch', () => {
  const previousFacets: SearchSuggestion[] = [
    { mode: SearchMode.Style, value: DISCOGS_STYLES[0]! },
    { mode: SearchMode.Style, value: DISCOGS_STYLES[1]! },
  ]
  const picked: SearchSuggestion = { mode: SearchMode.Genre, value: DISCOGS_GENRES[0]! }
  const shownResults = [makeResult({ genre: [DISCOGS_GENRES[0]!], style: [DISCOGS_STYLES[2]!] })]

  it('returns a refined facet set that includes the picked facet', async () => {
    mockFetchOnce(
      200,
      toolUseResponse('select_refined_vibe_facets', [
        { mode: 'style', value: DISCOGS_STYLES[0]! },
        picked,
      ]),
    )

    const result = await refineVibeSearch(previousFacets, shownResults, picked)

    expect(result).toEqual([{ mode: SearchMode.Style, value: DISCOGS_STYLES[0]! }, picked])
  })

  it('rejects when the picked facet is missing from the refined set', async () => {
    // Swaps one previous facet for a new one (a valid replaced-count) but never includes `picked`.
    mockFetchOnce(
      200,
      toolUseResponse('select_refined_vibe_facets', [
        { mode: 'style', value: DISCOGS_STYLES[0]! },
        { mode: 'style', value: DISCOGS_STYLES[2]! },
      ]),
    )

    await expect(refineVibeSearch(previousFacets, shownResults, picked)).rejects.toThrow(
      'did not include the picked suggestion',
    )
  })

  it('rejects when the replaced-facet count is out of bounds', async () => {
    // Replaces 0 facets relative to previousFacets (same 2 facets returned) — below MIN_REPLACED.
    mockFetchOnce(
      200,
      toolUseResponse('select_refined_vibe_facets', [
        { mode: 'style', value: DISCOGS_STYLES[0]! },
        { mode: 'style', value: DISCOGS_STYLES[1]! },
      ]),
    )

    await expect(refineVibeSearch(previousFacets, shownResults, previousFacets[0]!)).rejects.toThrow(
      'expected between',
    )
  })
})
