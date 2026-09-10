import { buildCacheableTaxonomyBlock } from '@/api/taxonomy/taxonomyUtils'

describe('buildCacheableTaxonomyBlock', () => {
  it('returns a text block marked for ephemeral prompt caching', () => {
    const block = buildCacheableTaxonomyBlock()

    expect(block.type).toBe('text')
    expect(block.cache_control).toEqual({ type: 'ephemeral' })
    expect(typeof block.text).toBe('string')
    expect(block.text.length).toBeGreaterThan(0)
  })

  it('includes both genre and style sections', () => {
    const block = buildCacheableTaxonomyBlock()

    expect(block.text).toContain('Genres (name: vibe):')
    expect(block.text).toContain('Styles (name: vibe):')
  })
})
