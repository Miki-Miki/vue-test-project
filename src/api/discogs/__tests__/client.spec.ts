import { discogsRequest } from '@/api/discogs/client'

function jsonResponse(body: unknown, ok = true, status = 200, statusText = 'OK') {
  return { ok, status, statusText, json: () => Promise.resolve(body) }
}

describe('discogsRequest', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('calls fetch with a single argument when no init is given', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(jsonResponse({ hello: 'world' }))

    const result = await discogsRequest('/auth/discogs/status')

    expect(global.fetch).toHaveBeenCalledWith('/auth/discogs/status')
    expect(result).toEqual({ ok: true, status: 200, statusText: 'OK', data: { hello: 'world' } })
  })

  it('passes init through to fetch when given', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(jsonResponse({ authorizeUrl: 'x' }))

    await discogsRequest('/auth/discogs/login', { method: 'POST' })

    expect(global.fetch).toHaveBeenCalledWith('/auth/discogs/login', { method: 'POST' })
  })

  it('normalizes a non-ok response instead of throwing', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(jsonResponse({}, false, 401, 'Unauthorized'))

    const result = await discogsRequest('/api/discogs/database/search?track=x')

    expect(result.ok).toBe(false)
    expect(result.status).toBe(401)
    expect(result.statusText).toBe('Unauthorized')
  })

  it('propagates a thrown fetch error', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('network down'))

    await expect(discogsRequest('/api/discogs/database/search?track=x')).rejects.toThrow('network down')
  })
})
