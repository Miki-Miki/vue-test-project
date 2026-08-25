import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import SearchBar from '@/components/SearchBar/SearchBar.vue'
import { useDiscogsStore } from '@/stores/discogs'
import { useSearchHistoryStore } from '@/stores/searchHistory'
import { useSearchQuery } from '@/composables/useSearchQuery'
import { SearchMode } from '@/types/search'

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
    useSearchQuery().reset()
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
    expect(useSearchHistoryStore().sessions).toHaveLength(1)
    expect(wrapper.find('.search-bar-error').exists()).toBe(false)
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

    expect(wrapper.find('.search-bar-error').text()).toBe('HTTP 401: Unauthorized')
  })

  it('shows the exception message when fetch throws', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('network down'))

    const wrapper = mount(SearchBar)
    await wrapper.find('input').setValue('nirvana')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.find('.search-bar-error').text()).toBe('network down')
  })

  it('triggers a search on Enter in the input', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ results: [], pagination: { per_page: 1, pages: 1, page: 1, items: 0 } }),
    )

    const wrapper = mount(SearchBar)
    await wrapper.find('input').setValue('nirvana')
    await wrapper.find('input').trigger('keydown', { key: 'Enter' })

    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?track=nirvana')
  })

  it('routes a /genre command to the genre search endpoint and records the genre mode', async () => {
    const data = { results: [{ id: 1, title: 'Nevermind' }], pagination: { per_page: 1, pages: 1, page: 1, items: 1 } }
    ;(global.fetch as jest.Mock).mockResolvedValue(jsonResponse(data))

    const wrapper = mount(SearchBar)
    await wrapper.find('input').setValue('/genre rock')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?genre=rock&type=release')
    expect(useDiscogsStore().lastQuery).toBe('/genre rock')
    expect(useDiscogsStore().lastSearchMode).toBe(SearchMode.Genre)
  })

  it('routes a /style command to the style search endpoint and records the style mode', async () => {
    const data = { results: [{ id: 2, title: 'Acid Tracks' }], pagination: { per_page: 1, pages: 1, page: 1, items: 1 } }
    ;(global.fetch as jest.Mock).mockResolvedValue(jsonResponse(data))

    const wrapper = mount(SearchBar)
    await wrapper.find('input').setValue('/style acid')
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?style=acid&type=release')
    expect(useDiscogsStore().lastQuery).toBe('/style acid')
    expect(useDiscogsStore().lastSearchMode).toBe(SearchMode.Style)
  })

  it('reflects a search triggered externally (e.g. from a genre-tag click) in the input', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ results: [], pagination: { per_page: 0, pages: 0, page: 1, items: 0 } }),
    )

    const wrapper = mount(SearchBar)
    await useSearchQuery().searchByCommand(SearchMode.Genre, 'Hip Hop')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('input').element.value).toBe('/genre "Hip Hop"')
    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?genre=Hip%20Hop&type=release')
  })

  it('reflects a search triggered externally from a style-tag click in the input', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ results: [], pagination: { per_page: 0, pages: 0, page: 1, items: 0 } }),
    )

    const wrapper = mount(SearchBar)
    await useSearchQuery().searchByCommand(SearchMode.Style, 'New Beat')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('input').element.value).toBe('/style "New Beat"')
    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?style=New%20Beat&type=release')
  })

  it('shows a filtered genre dropdown once /genre is typed', async () => {
    const wrapper = mount(SearchBar)
    await wrapper.find('input').setValue('/genre ro')
    await wrapper.find('input').trigger('input')

    const items = wrapper.findAll('.search-bar-suggestions-item')
    expect(items.length).toBeGreaterThan(0)
    expect(items.map((item) => item.text())).toContain('Rock')
  })

  it('shows no dropdown for a plain track search', async () => {
    const wrapper = mount(SearchBar)
    await wrapper.find('input').setValue('nirvana')
    await wrapper.find('input').trigger('input')

    expect(wrapper.find('.search-bar-suggestions').exists()).toBe(false)
  })

  it('selects a highlighted suggestion via ArrowDown + Enter and runs the search', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ results: [], pagination: { per_page: 0, pages: 0, page: 1, items: 0 } }),
    )

    const wrapper = mount(SearchBar)
    await wrapper.find('input').setValue('/genre roc')
    await wrapper.find('input').trigger('input')
    await wrapper.find('input').trigger('keydown', { key: 'ArrowDown' })
    await wrapper.find('input').trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(wrapper.find('input').element.value).toBe('/genre Rock')
    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?genre=Rock&type=release')
    expect(wrapper.find('.search-bar-suggestions').exists()).toBe(false)
  })

  it('selects a suggestion on mousedown and closes the dropdown', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ results: [], pagination: { per_page: 0, pages: 0, page: 1, items: 0 } }),
    )

    const wrapper = mount(SearchBar)
    await wrapper.find('input').setValue('/style aci')
    await wrapper.find('input').trigger('input')

    const item = wrapper.findAll('.search-bar-suggestions-item').find((el) => el.text() === 'Acid')
    expect(item).toBeDefined()
    await item!.trigger('mousedown')
    await flushPromises()

    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?style=Acid&type=release')
    expect(wrapper.find('.search-bar-suggestions').exists()).toBe(false)
  })

  it('closes the dropdown on Escape', async () => {
    const wrapper = mount(SearchBar)
    await wrapper.find('input').setValue('/genre ro')
    await wrapper.find('input').trigger('input')
    expect(wrapper.find('.search-bar-suggestions').exists()).toBe(true)

    await wrapper.find('input').trigger('keydown', { key: 'Escape' })

    expect(wrapper.find('.search-bar-suggestions').exists()).toBe(false)
  })
})
