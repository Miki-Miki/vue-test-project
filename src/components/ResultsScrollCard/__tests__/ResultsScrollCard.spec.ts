import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import ResultsScrollCard from '@/components/ResultsScrollCard/ResultsScrollCard.vue'
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
    style: ['Grunge'],
    uri: '/Nirvana-Nevermind/release/1',
    resource_url: 'https://api.discogs.com/releases/1',
  },
  {
    id: 2,
    title: 'Pink Floyd - The Wall',
    type: 'release',
    genre: ['Rock'],
    style: ['Prog Rock', 'Psychedelic Rock', 'Art Rock'],
    uri: '/Pink-Floyd-The-Wall/release/2',
    resource_url: 'https://api.discogs.com/releases/2',
  },
]

function mountCard(expanded = false, items: SearchResult[] = results) {
  return mount(ResultsScrollCard, {
    props: { query: 'rock', results: items, expanded },
    global: { stubs: { VDataTable: VDataTableStub } },
  })
}

describe('ResultsScrollCard', () => {
  it('shows the query and result count in the header', () => {
    const wrapper = mountCard(false)
    expect(wrapper.find('.results-scroll-card-header-query').text()).toBe('rock')
    expect(wrapper.find('.results-scroll-card-header-count').text()).toBe('2 results')
  })

  it('shows up to 4 unique genre/style tags when collapsed, with an ellipsis for the rest', () => {
    const wrapper = mountCard(false)
    const tags = wrapper.findAll('.results-scroll-card-summary-tags-tag')
    expect(tags.map((t) => t.text())).toEqual(['Rock', 'Non-Music', 'Grunge', 'Prog Rock'])
    expect(wrapper.find('.results-scroll-card-summary-tags-more').text()).toBe('…')
  })

  it('shows no ellipsis when there are 4 or fewer unique tags', () => {
    const wrapper = mountCard(false, [results[0]!])
    const tags = wrapper.findAll('.results-scroll-card-summary-tags-tag')
    expect(tags.map((t) => t.text())).toEqual(['Rock', 'Non-Music', 'Grunge'])
    expect(wrapper.find('.results-scroll-card-summary-tags-more').exists()).toBe(false)
  })

  it('renders no table when collapsed', () => {
    const wrapper = mountCard(false)
    expect(wrapper.findComponent(VDataTableStub).exists()).toBe(false)
  })

  it('renders a data table instead of the summary when expanded', () => {
    const wrapper = mountCard(true)
    expect(wrapper.findComponent(VDataTableStub).exists()).toBe(true)
    expect(wrapper.find('.results-scroll-card-summary').exists()).toBe(false)
    expect(wrapper.findComponent(VDataTableStub).props('items')).toEqual(results)
  })

  it('joins array values via the genre/style item slots when expanded', () => {
    const wrapper = mountCard(true)
    expect(wrapper.text()).toContain('Rock, Non-Music')
  })

  it('emits expandToggle when the header toggle is clicked', async () => {
    const wrapper = mountCard(false)
    await wrapper.find('.results-scroll-card-header-expand-toggle').trigger('click')
    expect(wrapper.emitted('expandToggle')).toHaveLength(1)
  })

  it('reflects the expanded state on the toggle button via aria-expanded', () => {
    const collapsed = mountCard(false)
    expect(collapsed.find('.results-scroll-card-header-expand-toggle').attributes('aria-expanded')).toBe(
      'false',
    )

    const expanded = mountCard(true)
    expect(expanded.find('.results-scroll-card-header-expand-toggle').attributes('aria-expanded')).toBe(
      'true',
    )
  })

  it('emits select via row-props onClick when a table row is clicked while expanded', () => {
    const wrapper = mountCard(true)
    const rowProps = wrapper.findComponent(VDataTableStub).props('rowProps') as (data: {
      item: SearchResult
    }) => { onClick: () => void }
    rowProps({ item: results[1]! }).onClick()
    expect(wrapper.emitted('select')).toEqual([[results[1]]])
  })
})
