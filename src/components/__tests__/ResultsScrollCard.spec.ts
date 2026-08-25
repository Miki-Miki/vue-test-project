import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import ResultsScrollCard from '@/components/ResultsScrollCard/ResultsScrollCard.vue'
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
    genre: ['Rock', 'Grunge'],
    uri: '/Nirvana-Nevermind/release/1',
    resource_url: 'https://api.discogs.com/releases/1',
  },
  {
    id: 2,
    title: 'Pink Floyd - The Wall',
    type: 'release',
    uri: '/Pink-Floyd-The-Wall/release/2',
    resource_url: 'https://api.discogs.com/releases/2',
  },
]

function mountCard(props: { query: string; results: SearchResult[] }) {
  return mount(ResultsScrollCard, {
    props,
    global: { stubs: { VInfiniteScroll: VInfiniteScrollStub } },
  })
}

describe('ResultsScrollCard', () => {
  it('renders the query and result count in the header', () => {
    const wrapper = mountCard({ query: '/genre rock', results })
    expect(wrapper.find('.results-scroll-card-header-query').text()).toBe('/genre rock')
    expect(wrapper.find('.results-scroll-card-header-count').text()).toBe('2 results')
  })

  it('renders one item per result with its title', () => {
    const wrapper = mountCard({ query: 'rock', results })
    const items = wrapper.findAll('.results-scroll-card-list-item')
    expect(items).toHaveLength(2)
    expect(items[0]!.find('.results-scroll-card-list-item-title').text()).toBe('Nirvana - Nevermind')
  })

  it('renders genre tags when present', () => {
    const wrapper = mountCard({ query: 'rock', results })
    const tags = wrapper
      .findAll('.results-scroll-card-list-item')[0]!
      .findAll('.results-scroll-card-list-item-genres-tag')
    expect(tags.map((t) => t.text())).toEqual(['Rock', 'Grunge'])
  })

  it('renders no genre tags when the result has no genre', () => {
    const wrapper = mountCard({ query: 'rock', results })
    const secondItem = wrapper.findAll('.results-scroll-card-list-item')[1]!
    expect(secondItem.find('.results-scroll-card-list-item-genres').exists()).toBe(false)
  })

  it('renders no items when results is empty', () => {
    const wrapper = mountCard({ query: 'nothing', results: [] })
    expect(wrapper.findAll('.results-scroll-card-list-item')).toHaveLength(0)
    expect(wrapper.find('.results-scroll-card-header-count').text()).toBe('0 results')
  })

  it('emits select with the clicked result', async () => {
    const wrapper = mountCard({ query: 'rock', results })
    await wrapper.findAll('.results-scroll-card-list-item')[1]!.trigger('click')
    expect(wrapper.emitted('select')).toEqual([[results[1]]])
  })

  it('emits select when Enter is pressed on an item', async () => {
    const wrapper = mountCard({ query: 'rock', results })
    await wrapper.findAll('.results-scroll-card-list-item')[0]!.trigger('keyup.enter')
    expect(wrapper.emitted('select')).toEqual([[results[0]]])
  })
})
