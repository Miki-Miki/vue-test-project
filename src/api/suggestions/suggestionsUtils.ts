import { taxonomyFor, toSearchMode } from '@/api/taxonomy/taxonomyUtils'
import type { SearchSuggestion } from '@/types/search'
import { SUGGESTION_COUNT } from './suggestionsConstants'

interface RawSuggestion {
  mode: string
  value: string
}

interface SuggestToolInput {
  suggestions: RawSuggestion[]
}

export function buildUserMessage(history: string[]): string {
  return `Search history (oldest to newest): ${JSON.stringify(history)}`
}

export function parseSuggestions(input: unknown): SearchSuggestion[] {
  const raw = input as Partial<SuggestToolInput> | undefined
  if (!raw || !Array.isArray(raw.suggestions) || raw.suggestions.length !== SUGGESTION_COUNT) {
    throw new Error('Claude did not return exactly 3 suggestions')
  }

  return raw.suggestions.map((suggestion) => {
    const mode = toSearchMode(suggestion.mode)
    if (!mode || !taxonomyFor(mode).includes(suggestion.value)) {
      throw new Error(`Claude returned an invalid suggestion: ${JSON.stringify(suggestion)}`)
    }
    return { mode, value: suggestion.value }
  })
}
