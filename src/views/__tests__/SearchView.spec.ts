import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import SearchView from '@/views/SearchView/SearchView.vue'
import { useDiscogsStore } from '@/stores/discogs'
import type { DiscogsResult } from '@/stores/discogs'

const mockAuthenticated = ref(true)

jest.mock('@/composables/useDiscogsAuth', () => ({
  useDiscogsAuth: () => ({ authenticated: mockAuthenticated, login: jest.fn(), logout: jest.fn() }),
}))

const result: DiscogsResult = {
  id: 1,
  title: 'Nirvana - Nevermind',
  type: 'release',
  uri: '/Nirvana-Nevermind/release/1',
  resource_url: 'https://api.discogs.com/releases/1',
}

describe('SearchView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockAuthenticated.value = true
  })

  it('shows the auth prompt when unauthenticated', () => {
    mockAuthenticated.value = false
    const wrapper = mount(SearchView)
    expect(wrapper.findComponent({ name: 'AuthPrompt' }).exists()).toBe(true)
    expect(wrapper.find('.search-view-results').exists()).toBe(false)
  })

  it('shows a placeholder when authenticated with no results', () => {
    const wrapper = mount(SearchView)
    expect(wrapper.findComponent({ name: 'AuthPrompt' }).exists()).toBe(false)
    expect(wrapper.find('.search-view-results-placeholder').text()).toBe('Search for artists, releases, labels…')
    expect(wrapper.find('pre').exists()).toBe(false)
  })

  it('shows the results as formatted JSON when authenticated with results', () => {
    useDiscogsStore().setResults({
      results: [result],
      pagination: { per_page: 1, pages: 1, page: 1, items: 1 },
    })

    const wrapper = mount(SearchView)
    expect(wrapper.find('.search-view-results-placeholder').exists()).toBe(false)
    expect(wrapper.find('pre').text()).toBe(JSON.stringify([result], null, 2))
  })
})
