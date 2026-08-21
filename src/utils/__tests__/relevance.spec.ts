import { normalize, rankResults, scoreTitle } from '@/utils/relevance'

describe('normalize', () => {
  it('lowercases, strips diacritics/punctuation, and collapses whitespace', () => {
    expect(normalize('Café  Rock & Roll!')).toBe('cafe rock roll')
  })
})

describe('scoreTitle', () => {
  it('tiers an exact match above a starts-with match', () => {
    const exact = scoreTitle('bohemian rhapsody', 'Bohemian Rhapsody')
    const startsWith = scoreTitle('bohemian rhapsody', 'Bohemian Rhapsody (Live at Wembley)')
    expect(exact.tier).toBeGreaterThan(startsWith.tier)
  })

  it('tiers a starts-with match above a whole-word (non-prefix) match', () => {
    const startsWith = scoreTitle('bohemian rhapsody', 'Bohemian Rhapsody (Live)')
    const wholeWord = scoreTitle('bohemian rhapsody', 'Queen - Bohemian Rhapsody (Live)')
    expect(startsWith.tier).toBeGreaterThan(wholeWord.tier)
  })

  it('tiers a whole-word match above a substring-only (partial word) match', () => {
    const wholeWord = scoreTitle('rhapsody', 'Queen - Bohemian Rhapsody')
    const substringOnly = scoreTitle('rhapsod', 'Queen - Bohemian Rhapsody')
    expect(wholeWord.tier).toBeGreaterThan(substringOnly.tier)
  })

  it('tiers any match above no match at all', () => {
    const noMatch = scoreTitle('bohemian rhapsody', 'Nirvana - Nevermind')
    expect(noMatch.tier).toBe(0)
  })

  it('gives partial word overlap a lower ratio than full overlap', () => {
    const full = scoreTitle('bohemian rhapsody', 'Queen - Bohemian Rhapsody (Live)')
    const partial = scoreTitle('bohemian rhapsody', 'Bohemian Sonata')
    expect(full.wordMatchRatio).toBeGreaterThan(partial.wordMatchRatio)
  })

  it('matches across diacritics, punctuation, and case', () => {
    expect(scoreTitle('cafe', 'Café').tier).toBeGreaterThan(0)
    expect(scoreTitle('rock roll', 'Rock & Roll').tier).toBeGreaterThan(0)
  })

  it('treats an empty query as no match', () => {
    expect(scoreTitle('', 'Anything').tier).toBe(0)
  })
})

describe('rankResults', () => {
  const results = [
    { title: 'Various - Greatest Hits of the 80s', community: { want: 900, have: 100 } },
    { title: 'Someone Unrelated', community: { want: 800, have: 100 } },
    { title: 'Another Compilation', community: { want: 700, have: 100 } },
    { title: 'Queen - Bohemian Rhapsody (Live)', community: { want: 50, have: 10 } },
    { title: 'Bohemian Rhapsody', community: { want: 10, have: 5 } },
  ]

  it('ranks a matching title above more popular non-matching titles', () => {
    const ranked = rankResults('bohemian rhapsody', results)
    expect(ranked[0].title).toBe('Bohemian Rhapsody')
    expect(ranked[1].title).toBe('Queen - Bohemian Rhapsody (Live)')
  })

  it('breaks ties within the same relevance tier by want, descending', () => {
    const tiedResults = [
      { title: 'Bohemian Rhapsody', community: { want: 10, have: 5 } },
      { title: 'Bohemian Rhapsody', community: { want: 999, have: 5 } },
    ]
    const ranked = rankResults('bohemian rhapsody', tiedResults)
    expect(ranked.map((r) => r.community.want)).toEqual([999, 10])
  })

  it('falls back to want-descending order when the query is empty', () => {
    const ranked = rankResults('', results)
    expect(ranked.map((r) => r.community.want)).toEqual([900, 800, 700, 50, 10])
  })

  it('does not mutate the input array', () => {
    const copy = [...results]
    rankResults('bohemian rhapsody', results)
    expect(results).toEqual(copy)
  })
})
