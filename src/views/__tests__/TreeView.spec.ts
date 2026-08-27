import { defineComponent, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import TreeView from '@/views/TreeView/TreeView.vue'
import { useSearchHistoryStore } from '@/stores/searchHistory'
import { useSearchQuery } from '@/composables/useSearchQuery'
import { useDetailPanel } from '@/composables/useDetailPanel'
import type { SearchResult } from '@/types/search'

const mockAuthenticated = ref(true)

jest.mock('@/composables/useDiscogsAuth', () => ({
  useDiscogsAuth: () => ({ authenticated: mockAuthenticated, login: jest.fn(), logout: jest.fn() }),
}))

const VDataTableStub = defineComponent({
  name: 'VDataTable',
  props: ['items', 'headers', 'rowProps'],
  template: '<div class="v-data-table-stub"></div>',
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
  return mount(TreeView, { global: { stubs: { VDataTable: VDataTableStub } } })
}

describe('TreeView', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActivePinia(createPinia())
    global.fetch = jest.fn()
    window.history.pushState({}, '', '/tree')
    useSearchQuery().reset()
    mockAuthenticated.value = true
  })

  afterEach(() => {
    window.history.pushState({}, '', '/')
    useDetailPanel().close()
  })

  it('shows the auth prompt and no cards when unauthenticated', () => {
    mockAuthenticated.value = false
    const historyStore = useSearchHistoryStore()
    historyStore.addEntry('rock', {
      results,
      pagination: { per_page: 2, pages: 1, page: 1, items: 2 },
    })

    const wrapper = mountTreeView()
    expect(wrapper.findComponent({ name: 'AuthPrompt' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ResultsScrollCard' }).exists()).toBe(false)
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

  it('expands a card on toggle, and collapses it again on a second toggle', async () => {
    const historyStore = useSearchHistoryStore()
    historyStore.addEntry('rock', {
      results,
      pagination: { per_page: 2, pages: 1, page: 1, items: 2 },
    })

    const wrapper = mountTreeView()
    const card = wrapper.findComponent({ name: 'ResultsScrollCard' })
    expect(card.props('expanded')).toBe(false)

    await card.vm.$emit('expand-toggle')
    expect(wrapper.findComponent({ name: 'ResultsScrollCard' }).props('expanded')).toBe(true)

    await card.vm.$emit('expand-toggle')
    expect(wrapper.findComponent({ name: 'ResultsScrollCard' }).props('expanded')).toBe(false)
  })

  it('collapses the previously-expanded card when a different card is expanded', async () => {
    let current = 1_000
    jest.spyOn(Date, 'now').mockImplementation(() => ++current)

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
    const [first, second] = wrapper.findAllComponents({ name: 'ResultsScrollCard' })

    await first!.vm.$emit('expand-toggle')
    expect(wrapper.findAllComponents({ name: 'ResultsScrollCard' })[0]!.props('expanded')).toBe(true)
    expect(wrapper.findAllComponents({ name: 'ResultsScrollCard' })[1]!.props('expanded')).toBe(false)

    await second!.vm.$emit('expand-toggle')
    expect(wrapper.findAllComponents({ name: 'ResultsScrollCard' })[0]!.props('expanded')).toBe(false)
    expect(wrapper.findAllComponents({ name: 'ResultsScrollCard' })[1]!.props('expanded')).toBe(true)
  })

  it('selects a result via the card through the shared detail panel composable, deselecting on a second select', async () => {
    const historyStore = useSearchHistoryStore()
    historyStore.addEntry('rock', {
      results,
      pagination: { per_page: 2, pages: 1, page: 1, items: 2 },
    })

    const wrapper = mountTreeView()
    expect(useDetailPanel().selectedResult.value).toBeNull()

    const card = wrapper.findComponent({ name: 'ResultsScrollCard' })
    await card.vm.$emit('select', results[0])
    expect(useDetailPanel().selectedResult.value).toEqual(results[0])

    await card.vm.$emit('select', results[0])
    expect(useDetailPanel().selectedResult.value).toBeNull()
  })
})
