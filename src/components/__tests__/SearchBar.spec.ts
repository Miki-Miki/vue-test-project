import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import SearchBar from '@/components/SearchBar.vue'
import { useDiscogsStore } from '@/stores/discogs'
import { useSearchHistoryStore } from '@/stores/searchHistory'

const mockAuthenticated = ref(true)

jest.mock('@/composables/useDiscogsAuth', () => ({
  useDiscogsAuth: () => ({
    authenticated: mockAuthenticated,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}))

function jsonResponse(body: unknown, ok = true, status = 200, statusText = 'OK') {
  return { ok, status, statusText, json: () => Promise.resolve(body) }
}

describe('SearchBar', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActivePinia(createPinia())
    mockAuthenticated.value = true
    global.fetch = jest.fn()
  })

  it('disables the input and button when unauthenticated', () => {
    mockAuthenticated.value = false
    const wrapper = mount(SearchBar)
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('does not search when the query is empty or whitespace', async () => {
    const wrapper = mount(SearchBar)
    await wrapper.find('input').setValue('   ')
    await wrapper.find('button').trigger('click')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('on success, stores results and adds a history entry', async () => {
    const data = { results: [{ id: 1, title: 'Nevermind' }], pagination: { per_page: 1, pages: 1, page: 1, items: 1 } }
    ;(global.fetch as jest.Mock).mockResolvedValue(jsonResponse(data))

    const wrapper = mount(SearchBar)
    await wrapper.find('input').setValue('nirvana')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?track=nirvana')
    expect(useDiscogsStore().results).toEqual(data.results)
    expect(useDiscogsStore().lastQuery).toBe('nirvana')
    expect(useSearchHistoryStore().entries).toHaveLength(1)
    expect(wrapper.find('.search-error').exists()).toBe(false)
  })

  it('shows the loading label while a search is in flight', async () => {
    let resolveFetch!: (v: unknown) => void
    ;(global.fetch as jest.Mock).mockReturnValue(new Promise((resolve) => (resolveFetch = resolve)))

    const wrapper = mount(SearchBar)
    await wrapper.find('input').setValue('nirvana')
    const searchPromise = wrapper.find('button').trigger('click')

    await Promise.resolve()
    expect(wrapper.find('button').text()).toBe('…')
    expect(wrapper.find('button').attributes('disabled')).toBeDefined()

    resolveFetch(jsonResponse({ results: [], pagination: { per_page: 1, pages: 1, page: 1, items: 0 } }))
    await searchPromise
    await flushPromises()

    expect(wrapper.find('button').text()).toBe('Search')
  })

  it('shows an HTTP error message when the response is not ok', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(jsonResponse({}, false, 401, 'Unauthorized'))

    const wrapper = mount(SearchBar)
    await wrapper.find('input').setValue('nirvana')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.find('.search-error').text()).toBe('HTTP 401: Unauthorized')
  })

  it('shows the exception message when fetch throws', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('network down'))

    const wrapper = mount(SearchBar)
    await wrapper.find('input').setValue('nirvana')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.find('.search-error').text()).toBe('network down')
  })

  it('triggers a search on Enter in the input', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ results: [], pagination: { per_page: 1, pages: 1, page: 1, items: 0 } }),
    )

    const wrapper = mount(SearchBar)
    await wrapper.find('input').setValue('nirvana')
    await wrapper.find('input').trigger('keyup.enter')

    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?track=nirvana')
  })
})
