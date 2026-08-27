import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import SearchSessionsSidebar from '@/components/SearchSessionsSidebar/SearchSessionsSidebar.vue'
import { useSearchHistoryStore } from '@/stores/searchHistory'

describe('SearchSessionsSidebar', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActivePinia(createPinia())
  })

  it('shows the empty state when there are no entries', () => {
    const wrapper = mount(SearchSessionsSidebar)
    expect(wrapper.text()).toContain('No searches yet')
    expect(wrapper.find('.search-sessions-sidebar-footer-clear-btn').exists()).toBe(false)
  })

  it('collapses and expands via the collapse button', async () => {
    const wrapper = mount(SearchSessionsSidebar)
    expect(wrapper.find('.search-sessions-sidebar').classes()).not.toContain(
      'search-sessions-sidebar-collapsed',
    )
    expect(wrapper.find('.search-sessions-sidebar-header-title').exists()).toBe(true)

    await wrapper.find('.search-sessions-sidebar-header-collapse-btn').trigger('click')

    expect(wrapper.find('.search-sessions-sidebar').classes()).toContain(
      'search-sessions-sidebar-collapsed',
    )
    expect(wrapper.find('.search-sessions-sidebar-header-title').exists()).toBe(false)
    expect(wrapper.find('.search-sessions-sidebar-body').exists()).toBe(false)
  })

  it('lists entries and highlights the active one', () => {
    const store = useSearchHistoryStore()
    store.addEntry('nirvana', { results: [], pagination: { per_page: 1, pages: 1, page: 1, items: 0 } })
    store.addEntry('floyd', { results: [], pagination: { per_page: 1, pages: 1, page: 1, items: 0 } })

    const wrapper = mount(SearchSessionsSidebar)
    const items = wrapper.findAll('.session-list-item')
    expect(items).toHaveLength(2)
    expect(items[0]!.text()).toContain('floyd')
    expect(items[0]!.classes()).toContain('session-list-item-active')
    expect(items[1]!.classes()).not.toContain('session-list-item-active')
    expect(wrapper.find('.search-sessions-sidebar-footer-clear-btn').exists()).toBe(true)
  })

  it('clicking an entry calls setActiveEntry with its id', async () => {
    const store = useSearchHistoryStore()
    store.addEntry('nirvana', { results: [], pagination: { per_page: 1, pages: 1, page: 1, items: 0 } })
    store.addEntry('floyd', { results: [], pagination: { per_page: 1, pages: 1, page: 1, items: 0 } })
    const setActiveEntry = jest.spyOn(store, 'setActiveEntry')

    const wrapper = mount(SearchSessionsSidebar)
    const secondEntry = wrapper.findAll('.session-list-item')[1]!
    await secondEntry.trigger('click')

    expect(setActiveEntry).toHaveBeenCalledWith(store.sessions[1]!.id)
  })

  it('pressing Enter on an entry also calls setActiveEntry', async () => {
    const store = useSearchHistoryStore()
    store.addEntry('nirvana', { results: [], pagination: { per_page: 1, pages: 1, page: 1, items: 0 } })
    const setActiveEntry = jest.spyOn(store, 'setActiveEntry')

    const wrapper = mount(SearchSessionsSidebar)
    await wrapper.find('.session-list-item').trigger('keyup.enter')

    expect(setActiveEntry).toHaveBeenCalledWith(store.sessions[0]!.id)
  })

  it('clicking "Clear history" calls clearHistory', async () => {
    const store = useSearchHistoryStore()
    store.addEntry('nirvana', { results: [], pagination: { per_page: 1, pages: 1, page: 1, items: 0 } })
    const clearHistory = jest.spyOn(store, 'clearHistory')

    const wrapper = mount(SearchSessionsSidebar)
    await wrapper.find('.search-sessions-sidebar-footer-clear-btn').trigger('click')

    expect(clearHistory).toHaveBeenCalledTimes(1)
  })

  it('clicking the new session button calls startNewSession', async () => {
    const store = useSearchHistoryStore()
    store.addEntry('nirvana', { results: [], pagination: { per_page: 1, pages: 1, page: 1, items: 0 } })
    const startNewSession = jest.spyOn(store, 'startNewSession')

    const wrapper = mount(SearchSessionsSidebar)
    await wrapper.find('.search-sessions-sidebar-header-new-session-btn').trigger('click')

    expect(startNewSession).toHaveBeenCalledTimes(1)
  })
})
