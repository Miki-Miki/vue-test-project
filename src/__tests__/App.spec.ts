import { createRouter, createMemoryHistory } from 'vue-router'
import { mount, flushPromises } from '@vue/test-utils'
import App from '@/App.vue'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'search', component: { template: '<div class="search-page" />' } },
      { path: '/grid', name: 'grid', component: { template: '<div class="grid-page" />' } },
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
      stubs: { SearchBar: true, SearchHistorySidebar: true },
    },
  })
  return { wrapper, router }
}

describe('App', () => {
  it('renders nav links to Search and Grid, and the matched route', async () => {
    const { wrapper, router } = await mountApp()
    const links = wrapper.findAll('.app-nav-links a')
    expect(links.map((l) => l.text())).toEqual(['Search', 'Grid'])
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
})
