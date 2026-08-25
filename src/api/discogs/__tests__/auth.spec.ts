import { fetchAuthStatus, login } from '@/api/discogs/auth'

function jsonResponse(body: unknown, ok = true, status = 200, statusText = 'OK') {
  return { ok, status, statusText, json: () => Promise.resolve(body) }
}

describe('discogs auth API', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('fetchAuthStatus GETs the status endpoint', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(jsonResponse({ authenticated: true }))

    const result = await fetchAuthStatus()

    expect(global.fetch).toHaveBeenCalledWith('/auth/discogs/status')
    expect(result.data).toEqual({ authenticated: true })
  })

  it('login POSTs to the login endpoint', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ authorizeUrl: 'https://discogs.com/oauth/authorize?x=1' }),
    )

    const result = await login()

    expect(global.fetch).toHaveBeenCalledWith('/auth/discogs/login', { method: 'POST' })
    expect(result.data).toEqual({ authorizeUrl: 'https://discogs.com/oauth/authorize?x=1' })
  })
})
