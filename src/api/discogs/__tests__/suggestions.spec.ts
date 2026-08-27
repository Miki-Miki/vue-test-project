import { suggestNextSearches } from '@/api/discogs/suggestions'
import { SearchMode } from '@/types/search'
import { DISCOGS_GENRES, DISCOGS_STYLES } from '@/data/discogsTaxonomy'

function mockFetchOnce(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as typeof fetch
}

function toolUseResponse(suggestions: Array<{ mode: string; value: string }>) {
  return {
    content: [{ type: 'tool_use', id: 'toolu_1', name: 'suggest_searches', input: { suggestions } }],
  }
}

describe('suggestNextSearches', () => {
  it('maps a valid tool_use response into SearchSuggestion[]', async () => {
    const genre = DISCOGS_GENRES[0]!
    const style = DISCOGS_STYLES[0]!
    const style2 = DISCOGS_STYLES[1]!
    mockFetchOnce(
      200,
      toolUseResponse([
        { mode: 'genre', value: genre },
        { mode: 'style', value: style },
        { mode: 'style', value: style2 },
      ]),
    )

    const result = await suggestNextSearches(['/genre Electronic'])

    expect(result).toEqual([
      { mode: SearchMode.Genre, value: genre },
      { mode: SearchMode.Style, value: style },
      { mode: SearchMode.Style, value: style2 },
    ])
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/claude/messages',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('rejects when Claude returns something other than exactly 3 suggestions', async () => {
    mockFetchOnce(200, toolUseResponse([{ mode: 'genre', value: DISCOGS_GENRES[0]! }]))

    await expect(suggestNextSearches([])).rejects.toThrow('exactly 3 suggestions')
  })

  it('rejects when a suggestion value is not in the taxonomy', async () => {
    mockFetchOnce(
      200,
      toolUseResponse([
        { mode: 'genre', value: 'Not A Real Genre' },
        { mode: 'style', value: DISCOGS_STYLES[0]! },
        { mode: 'style', value: DISCOGS_STYLES[1]! },
      ]),
    )

    await expect(suggestNextSearches([])).rejects.toThrow('invalid suggestion')
  })

  it('rejects when the response has no tool_use content block', async () => {
    mockFetchOnce(200, { content: [{ type: 'text', text: 'no thanks' }] })

    await expect(suggestNextSearches([])).rejects.toThrow('did not call suggest_searches')
  })

  it('rejects with the proxy error message on a non-OK response', async () => {
    mockFetchOnce(500, { error: 'Claude API error: rate limited' })

    await expect(suggestNextSearches([])).rejects.toThrow('rate limited')
  })
})
