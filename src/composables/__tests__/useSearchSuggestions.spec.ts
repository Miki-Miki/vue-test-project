import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import type { useSearchSuggestions as UseSearchSuggestions } from '@/composables/useSearchSuggestions'
import { DISCOGS_GENRES, DISCOGS_STYLES } from '@/data/discogsTaxonomy'

async function loadFreshModule(): Promise<typeof UseSearchSuggestions> {
  jest.resetModules()
  const mod = await import('@/composables/useSearchSuggestions')
  return mod.useSearchSuggestions
}

function useInComponent(
  useSearchSuggestions: typeof UseSearchSuggestions,
): ReturnType<typeof UseSearchSuggestions> {
  let exposed!: ReturnType<typeof UseSearchSuggestions>
  const TestComponent = defineComponent({
    setup() {
      exposed = useSearchSuggestions()
      return () => h('div')
    },
  })
  mount(TestComponent)
  return exposed
}

function toolUseResponse(suggestions: Array<{ mode: string; value: string }>) {
  return {
    content: [{ type: 'tool_use', id: 'toolu_1', name: 'suggest_searches', input: { suggestions } }],
  }
}

describe('useSearchSuggestions', () => {
  it('starts with no suggestions, not loading, and no error', async () => {
    const { suggestions, loading, error } = useInComponent(await loadFreshModule())
    expect(suggestions.value).toEqual([])
    expect(loading.value).toBe(false)
    expect(error.value).toBe('')
  })

  it('refresh() populates suggestions and clears error on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve(
          toolUseResponse([
            { mode: 'genre', value: DISCOGS_GENRES[0]! },
            { mode: 'style', value: DISCOGS_STYLES[0]! },
            { mode: 'style', value: DISCOGS_STYLES[1]! },
          ]),
        ),
    }) as unknown as typeof fetch

    const { suggestions, loading, error, refresh } = useInComponent(await loadFreshModule())
    await refresh(['/genre Electronic'])

    expect(loading.value).toBe(false)
    expect(error.value).toBe('')
    expect(suggestions.value).toHaveLength(3)
  })

  it('refresh() sets an error and clears suggestions on failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'))

    const { suggestions, loading, error, refresh } = useInComponent(await loadFreshModule())
    await refresh(['/genre Electronic'])

    expect(loading.value).toBe(false)
    expect(error.value).toBe('network down')
    expect(suggestions.value).toEqual([])
  })
})
