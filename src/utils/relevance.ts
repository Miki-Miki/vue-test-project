const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g')

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export interface TitleScore {
  tier: number
  wordMatchRatio: number
}

export function scoreTitle(query: string, title: string): TitleScore {
  const normalizedQuery = normalize(query)
  const normalizedTitle = normalize(title)

  if (!normalizedQuery) {
    return { tier: 0, wordMatchRatio: 0 }
  }

  if (normalizedTitle === normalizedQuery) {
    return { tier: 4, wordMatchRatio: 1 }
  }

  if (normalizedTitle.startsWith(normalizedQuery)) {
    return { tier: 3, wordMatchRatio: 1 }
  }

  const queryWords = normalizedQuery.split(' ').filter(Boolean)
  const matchedWords = queryWords.filter((word) =>
    new RegExp(`\\b${escapeRegExp(word)}\\b`).test(normalizedTitle),
  )
  const wordMatchRatio = matchedWords.length / queryWords.length

  if (wordMatchRatio === 1) {
    return { tier: 2, wordMatchRatio }
  }

  if (normalizedTitle.includes(normalizedQuery) || wordMatchRatio > 0) {
    return { tier: 1, wordMatchRatio }
  }

  return { tier: 0, wordMatchRatio: 0 }
}

export function compareByWantDesc<T extends { community?: { want: number } }>(a: T, b: T): number {
  return (b.community?.want ?? 0) - (a.community?.want ?? 0)
}

export function rankByPopularity<T extends { community?: { want: number } }>(results: T[]): T[] {
  return [...results].sort(compareByWantDesc)
}

export function rankResults<T extends { title: string; community?: { want: number } }>(
  query: string,
  results: T[],
): T[] {
  return [...results]
    .map((result) => ({ result, score: scoreTitle(query, result.title) }))
    .sort((a, b) => {
      if (a.score.tier !== b.score.tier) return b.score.tier - a.score.tier
      if (a.score.wordMatchRatio !== b.score.wordMatchRatio) {
        return b.score.wordMatchRatio - a.score.wordMatchRatio
      }
      return compareByWantDesc(a.result, b.result)
    })
    .map(({ result }) => result)
}
