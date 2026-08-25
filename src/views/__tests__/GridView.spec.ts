import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import type {
  ColDef,
  ValueFormatterFunc,
  ValueFormatterParams,
  ValueGetterFunc,
  ValueGetterParams,
} from 'ag-grid-community'
import GridView from '@/views/GridView/GridView.vue'
import { useDiscogsStore } from '@/stores/discogs'
import { SearchMode } from '@/types/search'
import type { SearchResult } from '@/types/search'

const AgGridVueStub = defineComponent({
  name: 'AgGridVue',
  props: ['rowData', 'columnDefs'],
  emits: ['row-clicked'],
  template: '<div class="ag-grid-stub" />',
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
  return mount(GridView, { global: { stubs: { AgGridVue: AgGridVueStub } } })
}

describe('GridView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    global.fetch = jest.fn()
  })

  it('shows the empty state and no grid when there are no results', () => {
    const wrapper = mountGridView()
    expect(wrapper.text()).toContain('Run a search to populate the grid.')
    expect(wrapper.findComponent(AgGridVueStub).exists()).toBe(false)
  })

  it('passes rowData and columnDefs to the grid', () => {
    useDiscogsStore().setResults({
      results,
      pagination: { per_page: 2, pages: 1, page: 1, items: 2 },
    })
    const wrapper = mountGridView()

    const grid = wrapper.findComponent(AgGridVueStub)
    expect(grid.exists()).toBe(true)
    expect(grid.props('rowData')).toEqual(results)
  })

  it('ranks rowData by keyword relevance ahead of "want" when a track query is active', () => {
    const store = useDiscogsStore()
    store.setResults({ results, pagination: { per_page: 2, pages: 1, page: 1, items: 2 } })
    store.setQuery('the wall')
    const wrapper = mountGridView()

    const grid = wrapper.findComponent(AgGridVueStub)
    expect((grid.props('rowData') as SearchResult[]).map((r) => r.id)).toEqual([2, 1])
    expect((grid.props('columnDefs') as ColDef[]).map((c) => c.field ?? c.headerName)).toEqual([
      'title',
      'type',
      'year',
      'country',
      'genre',
      'style',
      'Want',
    ])
  })

  it('ranks rowData by "want" descending when in genre search mode, ignoring title relevance', () => {
    const store = useDiscogsStore()
    store.setResults({ results, pagination: { per_page: 2, pages: 1, page: 1, items: 2 } })
    store.setQuery('/genre rock', SearchMode.Genre)
    const wrapper = mountGridView()

    const grid = wrapper.findComponent(AgGridVueStub)
    expect((grid.props('rowData') as SearchResult[]).map((r) => r.id)).toEqual([1, 2])
  })

  it('ranks rowData by "want" descending when in style search mode, ignoring title relevance', () => {
    const store = useDiscogsStore()
    store.setResults({ results, pagination: { per_page: 2, pages: 1, page: 1, items: 2 } })
    store.setQuery('/style acid', SearchMode.Style)
    const wrapper = mountGridView()

    const grid = wrapper.findComponent(AgGridVueStub)
    expect((grid.props('rowData') as SearchResult[]).map((r) => r.id)).toEqual([1, 2])
  })

  it('joins array values via the genre/style valueFormatter', () => {
    useDiscogsStore().setResults({
      results,
      pagination: { per_page: 2, pages: 1, page: 1, items: 2 },
    })
    const wrapper = mountGridView()
    const colDefs = wrapper
      .findComponent(AgGridVueStub)
      .props('columnDefs') as ColDef<SearchResult>[]
    const genreCol = colDefs.find((c) => c.field === 'genre')!

    const formatter = genreCol.valueFormatter as ValueFormatterFunc<SearchResult>
    expect(formatter({ value: ['Rock', 'Non-Music'] } as ValueFormatterParams)).toBe(
      'Rock, Non-Music',
    )
    expect(formatter({ value: undefined } as unknown as ValueFormatterParams)).toBe('')
  })

  it("reads community.want via the hidden Want column's valueGetter", () => {
    useDiscogsStore().setResults({
      results,
      pagination: { per_page: 2, pages: 1, page: 1, items: 2 },
    })
    const wrapper = mountGridView()
    const colDefs = wrapper
      .findComponent(AgGridVueStub)
      .props('columnDefs') as ColDef<SearchResult>[]
    const wantCol = colDefs.find((c) => c.headerName === 'Want')!

    const getter = wantCol.valueGetter as ValueGetterFunc<SearchResult>
    expect(getter({ data: results[0] } as ValueGetterParams<SearchResult>)).toBe(500)
    expect(getter({ data: results[1] } as ValueGetterParams<SearchResult>)).toBeUndefined()
  })

  it('selects a row on row-clicked and shows its detail panel, deselecting on a second click', async () => {
    useDiscogsStore().setResults({
      results,
      pagination: { per_page: 2, pages: 1, page: 1, items: 2 },
    })
    const wrapper = mountGridView()
    expect(wrapper.findComponent({ name: 'DetailPanel' }).exists()).toBe(false)

    await wrapper.findComponent(AgGridVueStub).vm.$emit('row-clicked', { data: results[0] })
    const panel = wrapper.findComponent({ name: 'DetailPanel' })
    expect(panel.exists()).toBe(true)
    expect(panel.props('result')).toEqual(results[0])

    await wrapper.findComponent(AgGridVueStub).vm.$emit('row-clicked', { data: results[0] })
    expect(wrapper.findComponent({ name: 'DetailPanel' }).exists()).toBe(false)
  })

  it('deselects the row when the detail panel emits close', async () => {
    useDiscogsStore().setResults({
      results,
      pagination: { per_page: 2, pages: 1, page: 1, items: 2 },
    })
    const wrapper = mountGridView()

    await wrapper.findComponent(AgGridVueStub).vm.$emit('row-clicked', { data: results[0] })
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
      json: () => Promise.resolve({ results: [], pagination: { per_page: 0, pages: 0, page: 1, items: 0 } }),
    })

    const wrapper = mountGridView()
    await wrapper.findComponent(AgGridVueStub).vm.$emit('row-clicked', { data: results[0] })
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
      json: () => Promise.resolve({ results: [], pagination: { per_page: 0, pages: 0, page: 1, items: 0 } }),
    })

    const wrapper = mountGridView()
    await wrapper.findComponent(AgGridVueStub).vm.$emit('row-clicked', { data: results[0] })
    const panel = wrapper.findComponent({ name: 'DetailPanel' })

    await panel.vm.$emit('command-select', SearchMode.Style, 'Acid')
    await flushPromises()

    expect(wrapper.findComponent({ name: 'DetailPanel' }).exists()).toBe(false)
    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?style=Acid&type=release')
    expect(useDiscogsStore().lastSearchMode).toBe(SearchMode.Style)
  })
})
