import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import type {
  ColDef,
  ValueFormatterFunc,
  ValueFormatterParams,
  ValueGetterFunc,
  ValueGetterParams,
} from 'ag-grid-community'
import GridView from '@/views/GridView.vue'
import { useDiscogsStore } from '@/stores/discogs'
import type { DiscogsResult } from '@/stores/discogs'

const AgGridVueStub = defineComponent({
  name: 'AgGridVue',
  props: ['rowData', 'columnDefs'],
  emits: ['row-clicked'],
  template: '<div class="ag-grid-stub" />',
})

const results: DiscogsResult[] = [
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

  it('ranks rowData by keyword relevance ahead of "want" when a query is active', () => {
    const store = useDiscogsStore()
    store.setResults({ results, pagination: { per_page: 2, pages: 1, page: 1, items: 2 } })
    store.setQuery('the wall')
    const wrapper = mountGridView()

    const grid = wrapper.findComponent(AgGridVueStub)
    expect((grid.props('rowData') as DiscogsResult[]).map((r) => r.id)).toEqual([2, 1])
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

  it('joins array values via the genre/style valueFormatter', () => {
    useDiscogsStore().setResults({
      results,
      pagination: { per_page: 2, pages: 1, page: 1, items: 2 },
    })
    const wrapper = mountGridView()
    const colDefs = wrapper
      .findComponent(AgGridVueStub)
      .props('columnDefs') as ColDef<DiscogsResult>[]
    const genreCol = colDefs.find((c) => c.field === 'genre')!

    const formatter = genreCol.valueFormatter as ValueFormatterFunc<DiscogsResult>
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
      .props('columnDefs') as ColDef<DiscogsResult>[]
    const wantCol = colDefs.find((c) => c.headerName === 'Want')!

    const getter = wantCol.valueGetter as ValueGetterFunc<DiscogsResult>
    expect(getter({ data: results[0] } as ValueGetterParams<DiscogsResult>)).toBe(500)
    expect(getter({ data: results[1] } as ValueGetterParams<DiscogsResult>)).toBeUndefined()
  })

  it('selects a row on row-clicked and shows its detail panel, deselecting on a second click', async () => {
    useDiscogsStore().setResults({
      results,
      pagination: { per_page: 2, pages: 1, page: 1, items: 2 },
    })
    const wrapper = mountGridView()
    expect(wrapper.findComponent({ name: 'DiscogsDetailPanel' }).exists()).toBe(false)

    await wrapper.findComponent(AgGridVueStub).vm.$emit('row-clicked', { data: results[0] })
    const panel = wrapper.findComponent({ name: 'DiscogsDetailPanel' })
    expect(panel.exists()).toBe(true)
    expect(panel.props('result')).toEqual(results[0])

    await wrapper.findComponent(AgGridVueStub).vm.$emit('row-clicked', { data: results[0] })
    expect(wrapper.findComponent({ name: 'DiscogsDetailPanel' }).exists()).toBe(false)
  })
})
