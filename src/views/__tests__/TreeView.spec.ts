import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import TreeView from '@/views/TreeView/TreeView.vue'
import { useSearchHistoryStore } from '@/stores/searchHistory'
import { useSearchQuery } from '@/composables/useSearchQuery'
import { SearchMode } from '@/types/search'
import type { SearchResult } from '@/types/search'

const VInfiniteScrollStub = defineComponent({
  name: 'VInfiniteScroll',
  props: ['mode', 'emptyText'],
  emits: ['load'],
  template: '<div class="v-infinite-scroll-stub"><slot /></div>',
})

const results: SearchResult[] = [
  {
    id: 1,
    title: 'Nirvana - Nevermind',
    type: 'release',
    uri: '/Nirvana-Nevermind/release/1',
    resource_url: 'https://api.discogs.com/releases/1',
    community: { want: 100, have: 10 },
  },
  {
    id: 2,
    title: 'Pink Floyd - The Wall',
    type: 'release',
    uri: '/Pink-Floyd-The-Wall/release/2',
    resource_url: 'https://api.discogs.com/releases/2',
    community: { want: 500, have: 10 },
  },
]

function mountTreeView() {
  return mount(TreeView, { global: { stubs: { VInfiniteScroll: VInfiniteScrollStub } } })
}

describe('TreeView', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActivePinia(createPinia())
    global.fetch = jest.fn()
    window.history.pushState({}, '', '/tree')
    useSearchQuery().reset()
  })

  afterEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('shows the empty state when there is no active session', () => {
    const wrapper = mountTreeView()
    expect(wrapper.text()).toContain('Search a style, genre, or song to start exploring.')
    expect(wrapper.findComponent({ name: 'ResultsScrollCard' }).exists()).toBe(false)
  })

  it('renders one card per search in the active session, ranked by popularity', () => {
    const historyStore = useSearchHistoryStore()
    historyStore.addEntry('rock', {
      results,
      pagination: { per_page: 2, pages: 1, page: 1, items: 2 },
    })

    const wrapper = mountTreeView()
    const cards = wrapper.findAllComponents({ name: 'ResultsScrollCard' })
    expect(cards).toHaveLength(1)
    expect(cards[0]!.props('query')).toBe('rock')
    expect((cards[0]!.props('results') as SearchResult[]).map((r) => r.id)).toEqual([2, 1])
  })

  it('stacks a second card when the session has more than one search', () => {
    const historyStore = useSearchHistoryStore()
    historyStore.addEntry('rock', {
      results,
      pagination: { per_page: 2, pages: 1, page: 1, items: 2 },
    })
    historyStore.appendSearch('/genre jazz', {
      results: [results[0]!],
      pagination: { per_page: 1, pages: 1, page: 1, items: 1 },
    })

    const wrapper = mountTreeView()
    const cards = wrapper.findAllComponents({ name: 'ResultsScrollCard' })
    expect(cards).toHaveLength(2)
    expect(cards.map((c) => c.props('query'))).toEqual(['rock', '/genre jazz'])
  })

  it('selects a result via the card, opening the detail panel, and deselects on a second select', async () => {
    const historyStore = useSearchHistoryStore()
    historyStore.addEntry('rock', {
      results,
      pagination: { per_page: 2, pages: 1, page: 1, items: 2 },
    })

    const wrapper = mountTreeView()
    expect(wrapper.findComponent({ name: 'DetailPanel' }).exists()).toBe(false)

    const card = wrapper.findComponent({ name: 'ResultsScrollCard' })
    await card.vm.$emit('select', results[0])
    const panel = wrapper.findComponent({ name: 'DetailPanel' })
    expect(panel.exists()).toBe(true)
    expect(panel.props('result')).toEqual(results[0])

    await card.vm.$emit('select', results[0])
    expect(wrapper.findComponent({ name: 'DetailPanel' }).exists()).toBe(false)
  })

  it('appends a new card onto the session when a genre tag is clicked in the detail panel', async () => {
    const historyStore = useSearchHistoryStore()
    historyStore.addEntry('rock', {
      results,
      pagination: { per_page: 2, pages: 1, page: 1, items: 2 },
    })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () =>
        Promise.resolve({ results: [], pagination: { per_page: 0, pages: 0, page: 1, items: 0 } }),
    })

    const wrapper = mountTreeView()
    const card = wrapper.findComponent({ name: 'ResultsScrollCard' })
    await card.vm.$emit('select', results[0])
    const panel = wrapper.findComponent({ name: 'DetailPanel' })

    await panel.vm.$emit('command-select', SearchMode.Genre, 'Grunge')
    await flushPromises()

    expect(wrapper.findComponent({ name: 'DetailPanel' }).exists()).toBe(false)
    expect(historyStore.sessions).toHaveLength(1)
    expect(historyStore.sessions[0]!.searches).toHaveLength(2)
    expect(wrapper.findAllComponents({ name: 'ResultsScrollCard' })).toHaveLength(2)
  })
})
