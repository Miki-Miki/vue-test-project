import type { MessageParam, Tool } from '@anthropic-ai/sdk/resources/messages'
import { SearchMode } from '@/types/search'
import type { SearchSuggestion } from '@/types/search'
import { DISCOGS_GENRES, DISCOGS_STYLES } from '@/data/discogsTaxonomy'
import { SUGGESTION_COUNT } from '@/api/suggestions/suggestionsConstants'
import { MIN_FACETS } from '@/api/vibeSearch/vibeSearchConstants'
import type { ClaudeResponse } from './client'
import type { RawMessagesData, SendMessageOptions } from './messages'

const TAXONOMY_POOL: SearchSuggestion[] = [
  ...DISCOGS_STYLES.map((value) => ({ mode: SearchMode.Style, value })),
  ...DISCOGS_GENRES.map((value) => ({ mode: SearchMode.Genre, value })),
]

function pickSuggestions(count: number, usedText: string): SearchSuggestion[] {
  const unused = TAXONOMY_POOL.filter((s) => !usedText.includes(s.value))
  const pool = unused.length >= count ? unused : TAXONOMY_POOL
  return pool.slice(0, count)
}

function messagesText(messages: MessageParam[]): string {
  return messages.map((m) => (typeof m.content === 'string' ? m.content : '')).join('\n')
}

function arrayKeyFor(toolName: string | undefined): { key: string; count: number } {
  switch (toolName) {
    case 'select_vibe_facets':
    case 'select_refined_vibe_facets':
      return { key: 'facets', count: MIN_FACETS }
    case 'suggest_searches':
    default:
      return { key: 'suggestions', count: SUGGESTION_COUNT }
  }
}

/**
 * Dev-only stand-in for a real Claude call, gated behind VITE_MOCK_CLAUDE (see sendMessage
 * in ./messages.ts) so this repo stays testable while the Claude API key is expired.
 * Always draws from the real DISCOGS_GENRES/DISCOGS_STYLES taxonomy so downstream
 * validation (parseSuggestions/parseFacets) never rejects a mocked response.
 */
export function mockToolUseResponse(
  messages: MessageParam[],
  options?: SendMessageOptions,
): ClaudeResponse<RawMessagesData> {
  const tool: Tool | undefined = options?.tools?.[0]
  const { key, count } = arrayKeyFor(tool?.name)
  const picks = pickSuggestions(count, messagesText(messages))

  return {
    ok: true,
    status: 200,
    statusText: 'OK (mocked)',
    data: {
      content: [
        {
          type: 'tool_use',
          id: 'mock_tool_use',
          name: tool?.name ?? 'mock',
          input: { [key]: picks },
          caller: { type: 'direct' },
        },
      ],
    },
  }
}
