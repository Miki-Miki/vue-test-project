import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import GridView from '@/views/GridView/GridView.vue'
import { useDiscogsStore } from '@/stores/discogs'
import { SearchMode } from '@/types/search'
import type { SearchResult } from '@/types/search'

const VDataTableStub = defineComponent({
  name: 'VDataTable',
  props: ['items', 'headers', 'rowProps'],
  template: `
    <div class="v-data-table-stub">
      <slot name="item.genre" v-for="item in items" :value="item.genre" :key="'genre-' + item.id" />
      <slot name="item.style" v-for="item in items" :value="item.style" :key="'style-' + item.id" />
    </div>
  `,
})

const results: SearchResult[] = [
  {
    id: 1,
    title: 'Nirvana - Nevermind',
    type: 'release',
    genre: ['Rock', 'Non-Music'],
    style: [],
    uri: '/Nirvana-Nevermind/release/1',
    resource_url: 'https://api.discogs.com/releases/1',
    community: { want: 500, have: 200 },
  },
  {
    id: 2,
    title: 'Pink Floyd - The Wall',
    type: 'release',
    uri: '/Pink-Floyd-The-Wall/release/2',
    resource_url: 'https://api.discogs.com/releases/2',
  },
]

function mountGridView() {
  return mount(GridView, { global: { stubs: { VDataTable: VDataTableStub } } })
}

function clickRow(wrapper: ReturnType<typeof mountGridView>, item: SearchResult) {
  const rowProps = wrapper.findComponent(VDataTableStub).props('rowProps') as (data: {
    item: SearchResult
  }) => { onClick: () => void }
  return rowProps({ item }).onClick()
}

describe('GridView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    global.fetch = jest.fn()
  })

  it('shows the empty state and no table when there are no results', () => {
    const wrapper = mountGridView()
    expect(wrapper.text()).toContain('Run a search to populate the grid.')
    expect(wrapper.findComponent(VDataTableStub).exists()).toBe(false)
  })

  it('passes items and headers to the table', () => {
    useDiscogsStore().setResults({
      results,
      pagination: { per_page: 2, pages: 1, page: 1, items: 2 },
    })
    const wrapper = mountGridView()

    const table = wrapper.findComponent(VDataTableStub)
    expect(table.exists()).toBe(true)
    expect(table.props('items')).toEqual(results)
  })

  it('ranks items by keyword relevance ahead of "want" when a track query is active', () => {
    const store = useDiscogsStore()
    store.setResults({ results, pagination: { per_page: 2, pages: 1, page: 1, items: 2 } })
    store.setQuery('the wall')
    const wrapper = mountGridView()

    const table = wrapper.findComponent(VDataTableStub)
    expect((table.props('items') as SearchResult[]).map((r) => r.id)).toEqual([2, 1])
    expect((table.props('headers') as { key: string }[]).map((h) => h.key)).toEqual([
      'title',
      'type',
      'year',
      'country',
      'genre',
      'style',
      'community.want',
    ])
  })

  it('ranks items by "want" descending when in genre search mode, ignoring title relevance', () => {
    const store = useDiscogsStore()
    store.setResults({ results, pagination: { per_page: 2, pages: 1, page: 1, items: 2 } })
    store.setQuery('/genre rock', SearchMode.Genre)
    const wrapper = mountGridView()

    const table = wrapper.findComponent(VDataTableStub)
    expect((table.props('items') as SearchResult[]).map((r) => r.id)).toEqual([1, 2])
  })

  it('ranks items by "want" descending when in style search mode, ignoring title relevance', () => {
    const store = useDiscogsStore()
    store.setResults({ results, pagination: { per_page: 2, pages: 1, page: 1, items: 2 } })
    store.setQuery('/style acid', SearchMode.Style)
    const wrapper = mountGridView()

    const table = wrapper.findComponent(VDataTableStub)
    expect((table.props('items') as SearchResult[]).map((r) => r.id)).toEqual([1, 2])
  })

  it('joins array values via the genre/style item slots', () => {
    useDiscogsStore().setResults({
      results,
      pagination: { per_page: 2, pages: 1, page: 1, items: 2 },
    })
    const wrapper = mountGridView()

    expect(wrapper.text()).toContain('Rock, Non-Music')
  })

  it('selects a row via row-props onClick and shows its detail panel, deselecting on a second click', async () => {
    useDiscogsStore().setResults({
      results,
      pagination: { per_page: 2, pages: 1, page: 1, items: 2 },
    })
    const wrapper = mountGridView()
    expect(wrapper.findComponent({ name: 'DetailPanel' }).exists()).toBe(false)

    clickRow(wrapper, results[0])
    await wrapper.vm.$nextTick()
    const panel = wrapper.findComponent({ name: 'DetailPanel' })
    expect(panel.exists()).toBe(true)
    expect(panel.props('result')).toEqual(results[0])

    clickRow(wrapper, results[0])
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ name: 'DetailPanel' }).exists()).toBe(false)
  })

  it('deselects the row when the detail panel emits close', async () => {
    useDiscogsStore().setResults({
      results,
      pagination: { per_page: 2, pages: 1, page: 1, items: 2 },
    })
    const wrapper = mountGridView()

    clickRow(wrapper, results[0])
    await wrapper.vm.$nextTick()
    const panel = wrapper.findComponent({ name: 'DetailPanel' })
    expect(panel.exists()).toBe(true)

    await panel.vm.$emit('close')
    expect(wrapper.findComponent({ name: 'DetailPanel' }).exists()).toBe(false)
  })

  it('deselects the row and triggers a genre search when the detail panel emits command-select with Genre', async () => {
    useDiscogsStore().setResults({
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

    const wrapper = mountGridView()
    clickRow(wrapper, results[0])
    await wrapper.vm.$nextTick()
    const panel = wrapper.findComponent({ name: 'DetailPanel' })

    await panel.vm.$emit('command-select', SearchMode.Genre, 'Rock')
    await flushPromises()

    expect(wrapper.findComponent({ name: 'DetailPanel' }).exists()).toBe(false)
    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?genre=Rock&type=release')
    expect(useDiscogsStore().lastSearchMode).toBe(SearchMode.Genre)
  })

  it('deselects the row and triggers a style search when the detail panel emits command-select with Style', async () => {
    useDiscogsStore().setResults({
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

    const wrapper = mountGridView()
    clickRow(wrapper, results[0])
    await wrapper.vm.$nextTick()
    const panel = wrapper.findComponent({ name: 'DetailPanel' })

    await panel.vm.$emit('command-select', SearchMode.Style, 'Acid')
    await flushPromises()

    expect(wrapper.findComponent({ name: 'DetailPanel' }).exists()).toBe(false)
    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?style=Acid&type=release')
    expect(useDiscogsStore().lastSearchMode).toBe(SearchMode.Style)
  })
})
