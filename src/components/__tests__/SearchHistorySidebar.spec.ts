import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import SearchHistorySidebar from '@/components/SearchHistorySidebar.vue'
import { useSearchHistoryStore } from '@/stores/searchHistory'

describe('SearchHistorySidebar', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActivePinia(createPinia())
  })

  it('shows the empty state when there are no entries', () => {
    const wrapper = mount(SearchHistorySidebar)
    expect(wrapper.text()).toContain('No searches yet')
    expect(wrapper.find('.clear-btn').exists()).toBe(false)
  })

  it('collapses and expands via the collapse button', async () => {
    const wrapper = mount(SearchHistorySidebar)
    expect(wrapper.find('.sidebar').classes()).not.toContain('collapsed')
    expect(wrapper.find('.sidebar-title').exists()).toBe(true)

    await wrapper.find('.collapse-btn').trigger('click')

    expect(wrapper.find('.sidebar').classes()).toContain('collapsed')
    expect(wrapper.find('.sidebar-title').exists()).toBe(false)
    expect(wrapper.find('.sidebar-body').exists()).toBe(false)
  })

  it('lists entries and highlights the active one', () => {
    const store = useSearchHistoryStore()
    store.addEntry('nirvana', { results: [], pagination: { per_page: 1, pages: 1, page: 1, items: 0 } })
    store.addEntry('floyd', { results: [], pagination: { per_page: 1, pages: 1, page: 1, items: 0 } })

    const wrapper = mount(SearchHistorySidebar)
    const items = wrapper.findAll('.entry')
    expect(items).toHaveLength(2)
    expect(items[0]!.text()).toContain('floyd')
    expect(items[0]!.classes()).toContain('active')
    expect(items[1]!.classes()).not.toContain('active')
    expect(wrapper.find('.clear-btn').exists()).toBe(true)
  })

  it('clicking an entry calls setActiveEntry with its id', async () => {
    const store = useSearchHistoryStore()
    store.addEntry('nirvana', { results: [], pagination: { per_page: 1, pages: 1, page: 1, items: 0 } })
    store.addEntry('floyd', { results: [], pagination: { per_page: 1, pages: 1, page: 1, items: 0 } })
    const setActiveEntry = jest.spyOn(store, 'setActiveEntry')

    const wrapper = mount(SearchHistorySidebar)
    const secondEntry = wrapper.findAll('.entry')[1]!
    await secondEntry.trigger('click')

    expect(setActiveEntry).toHaveBeenCalledWith(store.entries[1]!.id)
  })

  it('pressing Enter on an entry also calls setActiveEntry', async () => {
    const store = useSearchHistoryStore()
    store.addEntry('nirvana', { results: [], pagination: { per_page: 1, pages: 1, page: 1, items: 0 } })
    const setActiveEntry = jest.spyOn(store, 'setActiveEntry')

    const wrapper = mount(SearchHistorySidebar)
    await wrapper.find('.entry').trigger('keyup.enter')

    expect(setActiveEntry).toHaveBeenCalledWith(store.entries[0]!.id)
  })

  it('clicking "Clear history" calls clearHistory', async () => {
    const store = useSearchHistoryStore()
    store.addEntry('nirvana', { results: [], pagination: { per_page: 1, pages: 1, page: 1, items: 0 } })
    const clearHistory = jest.spyOn(store, 'clearHistory')

    const wrapper = mount(SearchHistorySidebar)
    await wrapper.find('.clear-btn').trigger('click')

    expect(clearHistory).toHaveBeenCalledTimes(1)
  })
})
