import type { Tool } from '@anthropic-ai/sdk/resources/messages'
import { SearchMode } from '@/types/search'
import type { SearchSuggestion } from '@/types/search'
import { sendMessage } from '@/api/claude/messages'
import { formatTaxonomyWithVibes, taxonomyFor, toSearchMode } from '@/api/discogs/taxonomyPrompt'

const SUGGESTION_COUNT = 3

const SUGGEST_SEARCHES_TOOL: Tool = {
  name: 'suggest_searches',
  description: 'Propose the next 3 genre/style searches to explore.',
  input_schema: {
    type: 'object',
    properties: {
      suggestions: {
        type: 'array',
        minItems: SUGGESTION_COUNT,
        maxItems: SUGGESTION_COUNT,
        items: {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: ['genre', 'style'] },
            value: { type: 'string' },
          },
          required: ['mode', 'value'],
        },
      },
    },
    required: ['suggestions'],
  },
}

const SYSTEM_PROMPT = `You are a music-discovery guide inside a Discogs genre/style explorer. The user
navigates by repeatedly picking a genre or style to search; each pick appends a
new result set to a growing chain. Your job is to propose the 3 best *next* picks.

Rules:
1. Every suggestion's \`value\` must be an exact, case-sensitive match to one entry
   in the provided genre or style list — never invent, abbreviate, or reword one.
2. Never suggest a genre or style that already appears anywhere in the search
   history — the user has already explored it.
3. Read the history as a trail, most recent entry last. Let the most recent
   search dominate your reasoning: if it was a genre, prefer styles you know are
   filed under that genre on Discogs (or, if unsure of a direct hierarchy
   relationship, styles that are stylistically adjacent); if it was a style,
   prefer sibling styles or the genre that style belongs to.
4. Make the 3 suggestions diverse from each other — don't propose 3 near-synonyms.
   Aim for a mix: one close/safe continuation of the last search, one adjacent but
   different branch, one that reintroduces a genre from earlier in the history
   (if any) so the user can branch back.
5. Prefer styles over genres when both are reasonable next picks — there are far
   more styles than genres, and leaning on styles keeps suggestions from
   converging on the same handful of broad genres over and over.
6. If the history is empty or only has one entry, favor broad, well-known
   genres/styles over obscure ones so the first branches are inviting.
7. Call \`suggest_searches\` with exactly 3 items. Do not respond with any text.`

interface RawSuggestion {
  mode: string
  value: string
}

interface SuggestToolInput {
  suggestions: RawSuggestion[]
}

function buildUserMessage(history: string[]): string {
  return [
    `Genres (name: vibe):\n${formatTaxonomyWithVibes(SearchMode.Genre)}`,
    `Styles (name: vibe):\n${formatTaxonomyWithVibes(SearchMode.Style)}`,
    `Search history (oldest to newest): ${JSON.stringify(history)}`,
  ].join('\n\n')
}

function parseSuggestions(input: unknown): SearchSuggestion[] {
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

export async function suggestNextSearches(history: string[]): Promise<SearchSuggestion[]> {
  const response = await sendMessage([{ role: 'user', content: buildUserMessage(history) }], {
    system: SYSTEM_PROMPT,
    tools: [SUGGEST_SEARCHES_TOOL],
    tool_choice: { type: 'tool', name: 'suggest_searches' },
  })

  if (!response.ok) {
    const errorData = response.data as unknown as { error?: string }
    throw new Error(errorData.error ?? `HTTP ${response.status}`)
  }

  const toolUse = response.data.content.find((block) => block.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not call suggest_searches')
  }

  return parseSuggestions(toolUse.input)
}
