import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import type { useDiscogsAuth as UseDiscogsAuth } from '@/composables/useDiscogsAuth'

const SESSION_KEY = 'discogs_authenticated'

function loadFreshModule(): typeof UseDiscogsAuth {
  jest.resetModules()
  return require('@/composables/useDiscogsAuth').useDiscogsAuth
}

function useInComponent(useDiscogsAuth: typeof UseDiscogsAuth): ReturnType<typeof UseDiscogsAuth> {
  let exposed!: ReturnType<typeof UseDiscogsAuth>
  const TestComponent = defineComponent({
    setup() {
      exposed = useDiscogsAuth()
      return () => h('div')
    },
  })
  mount(TestComponent)
  return exposed
}

async function flush() {
  await Promise.resolve()
  await Promise.resolve()
}

describe('useDiscogsAuth', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('initialises authenticated as false when sessionStorage has no cached value', () => {
    const { authenticated } = useInComponent(loadFreshModule())
    expect(authenticated.value).toBe(false)
  })

  it('initialises authenticated as true when sessionStorage has a cached value', () => {
    window.sessionStorage.setItem(SESSION_KEY, 'true')
    const { authenticated } = useInComponent(loadFreshModule())
    expect(authenticated.value).toBe(true)
  })

  it('login() posts to the login endpoint and attempts to redirect to the returned authorizeUrl', async () => {
    // jsdom's `location.href` setter is a non-configurable own property, so it can't be
    // spied/mocked here; assigning to it triggers a harmless "Not implemented: navigation"
    // jsdom console error instead of an actual navigation. We suppress that expected noise
    // and assert on the fetch call, which is the part of `login()` we can actually observe.
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ authorizeUrl: 'https://discogs.com/oauth/authorize?x=1' }),
    }) as unknown as typeof fetch

    const { login } = useInComponent(loadFreshModule())
    await expect(login()).resolves.toBeUndefined()

    expect(global.fetch).toHaveBeenCalledWith('/auth/discogs/login', { method: 'POST' })

    consoleError.mockRestore()
  })

  it('logout() clears authenticated state and sessionStorage', () => {
    window.sessionStorage.setItem(SESSION_KEY, 'true')
    const { authenticated, logout } = useInComponent(loadFreshModule())
    expect(authenticated.value).toBe(true)

    logout()

    expect(authenticated.value).toBe(false)
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBeNull()
  })

  it('on mount, syncs authenticated + sessionStorage from the status endpoint (authenticated)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ authenticated: true }),
    }) as unknown as typeof fetch

    const { authenticated } = useInComponent(loadFreshModule())
    await flush()

    expect(global.fetch).toHaveBeenCalledWith('/auth/discogs/status')
    expect(authenticated.value).toBe(true)
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBe('true')
  })

  it('on mount, clears sessionStorage when the status endpoint reports unauthenticated', async () => {
    window.sessionStorage.setItem(SESSION_KEY, 'true')
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ authenticated: false }),
    }) as unknown as typeof fetch

    const { authenticated } = useInComponent(loadFreshModule())
    await flush()

    expect(authenticated.value).toBe(false)
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBeNull()
  })

  it('on mount, keeps the cached value if the status request fails', async () => {
    window.sessionStorage.setItem(SESSION_KEY, 'true')
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'))

    const { authenticated } = useInComponent(loadFreshModule())
    await flush()

    expect(authenticated.value).toBe(true)
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBe('true')
  })
})
