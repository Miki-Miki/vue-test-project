import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import App from '@/App.vue'
import { useDetailPanel } from '@/composables/useDetailPanel'
import { useDiscogsStore } from '@/stores/discogs'
import { SearchMode } from '@/types/search'
import type { SearchResult } from '@/types/search'

const result: SearchResult = {
  id: 1,
  title: 'Nirvana - Nevermind',
  type: 'release',
  uri: '/Nirvana-Nevermind/release/1',
  resource_url: 'https://api.discogs.com/releases/1',
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'search', component: { template: '<div class="search-page" />' } },
      { path: '/grid', name: 'grid', component: { template: '<div class="grid-page" />' } },
      { path: '/tree', name: 'tree', component: { template: '<div class="tree-page" />' } },
    ],
  })
}

async function mountApp() {
  const router = createTestRouter()
  router.push('/')
  await router.isReady()
  const wrapper = mount(App, {
    global: {
      plugins: [router],
      stubs: { SearchBar: true, SearchSessionsSidebar: true },
    },
  })
  return { wrapper, router }
}

describe('App', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    useDetailPanel().close()
  })

  it('renders nav links to Search, Grid, and Tree, and the matched route', async () => {
    const { wrapper, router } = await mountApp()
    const links = wrapper.findAll('.app-nav-links a')
    expect(links.map((l) => l.text())).toEqual(['Search', 'Grid', 'Tree'])
    expect(wrapper.find('.search-page').exists()).toBe(true)

    await router.push('/grid')
    await flushPromises()
    expect(wrapper.find('.grid-page').exists()).toBe(true)
  })

  it('defaults to light mode when there is no data-theme attribute and the system prefers light', async () => {
    const { wrapper } = await mountApp()
    expect(wrapper.find('.app-nav-theme-toggle').attributes('aria-label')).toBe('Switch to dark mode')
  })

  it('initialises as dark when <html data-theme="dark"> is already set', async () => {
    document.documentElement.setAttribute('data-theme', 'dark')
    const { wrapper } = await mountApp()
    expect(wrapper.find('.app-nav-theme-toggle').attributes('aria-label')).toBe('Switch to light mode')
  })

  it('initialises as dark when the system prefers dark and no explicit theme is set', async () => {
    const matchMedia = window.matchMedia
    window.matchMedia = jest.fn().mockReturnValue({ matches: true })

    const { wrapper } = await mountApp()
    expect(wrapper.find('.app-nav-theme-toggle').attributes('aria-label')).toBe('Switch to light mode')

    window.matchMedia = matchMedia
  })

  it('toggles the theme and updates the data-theme attribute + aria-label on click', async () => {
    const { wrapper } = await mountApp()
    const button = wrapper.find('.app-nav-theme-toggle')
    expect(button.attributes('aria-label')).toBe('Switch to dark mode')

    await button.trigger('click')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(button.attributes('aria-label')).toBe('Switch to light mode')

    await button.trigger('click')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(button.attributes('aria-label')).toBe('Switch to dark mode')
  })

  it('does not render the detail panel until a result is selected via the shared composable', async () => {
    const { wrapper } = await mountApp()
    expect(wrapper.findComponent({ name: 'DetailPanel' }).exists()).toBe(false)

    useDetailPanel().open(result)
    await flushPromises()
    const panel = wrapper.findComponent({ name: 'DetailPanel' })
    expect(panel.exists()).toBe(true)
    expect(panel.props('result')).toEqual(result)
  })

  it('keeps the detail panel open across route changes, proving it is a single app-level instance', async () => {
    const { wrapper, router } = await mountApp()
    useDetailPanel().open(result)
    await flushPromises()

    await router.push('/grid')
    await flushPromises()

    expect(wrapper.find('.grid-page').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'DetailPanel' }).exists()).toBe(true)
  })

  it('closes the panel when DetailPanel emits close', async () => {
    const { wrapper } = await mountApp()
    useDetailPanel().open(result)
    await flushPromises()

    const panel = wrapper.findComponent({ name: 'DetailPanel' })
    await panel.vm.$emit('close')

    expect(wrapper.findComponent({ name: 'DetailPanel' }).exists()).toBe(false)
    expect(useDetailPanel().selectedResult.value).toBeNull()
  })

  it('closes the panel and triggers a genre search when DetailPanel emits command-select', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () =>
        Promise.resolve({ results: [], pagination: { per_page: 0, pages: 0, page: 1, items: 0 } }),
    })

    const { wrapper } = await mountApp()
    useDetailPanel().open(result)
    await flushPromises()

    const panel = wrapper.findComponent({ name: 'DetailPanel' })
    await panel.vm.$emit('command-select', SearchMode.Genre, 'Rock')
    await flushPromises()

    expect(wrapper.findComponent({ name: 'DetailPanel' }).exists()).toBe(false)
    expect(global.fetch).toHaveBeenCalledWith('/api/discogs/database/search?genre=Rock&type=release')
    expect(useDiscogsStore().lastSearchMode).toBe(SearchMode.Genre)
  })
})
