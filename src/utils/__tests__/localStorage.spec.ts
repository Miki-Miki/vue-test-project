import { lsGet, lsSet, lsRemove, lsClear } from '@/utils/localStorage'

describe('localStorage utils', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  describe('lsGet / lsSet', () => {
    it('round-trips a JSON value', () => {
      lsSet('foo', { a: 1, b: ['x', 'y'] })
      expect(lsGet('foo')).toEqual({ a: 1, b: ['x', 'y'] })
    })

    it('writes under the discogs: prefix', () => {
      lsSet('foo', 'bar')
      expect(window.localStorage.getItem('discogs:foo')).toBe('"bar"')
    })

    it('returns null for a missing key', () => {
      expect(lsGet('missing')).toBeNull()
    })

    it('returns null and does not throw on malformed JSON', () => {
      window.localStorage.setItem('discogs:broken', '{not valid json')
      expect(lsGet('broken')).toBeNull()
    })
  })

  describe('lsRemove', () => {
    it('removes only the targeted key', () => {
      lsSet('keep', 1)
      lsSet('drop', 2)
      lsRemove('drop')
      expect(lsGet('keep')).toBe(1)
      expect(lsGet('drop')).toBeNull()
    })
  })

  describe('lsClear', () => {
    it('removes all discogs:-prefixed keys and leaves others untouched', () => {
      lsSet('a', 1)
      lsSet('b', 2)
      window.localStorage.setItem('unrelated', 'untouched')

      lsClear()

      expect(lsGet('a')).toBeNull()
      expect(lsGet('b')).toBeNull()
      expect(window.localStorage.getItem('unrelated')).toBe('untouched')
    })

    it('restricts removal to a sub-prefix when given', () => {
      lsSet('search-history', [1])
      lsSet('other', [2])

      lsClear('search-history')

      expect(lsGet('search-history')).toBeNull()
      expect(lsGet('other')).toEqual([2])
    })
  })
})
