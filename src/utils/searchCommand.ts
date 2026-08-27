import { SearchMode } from '@/types/search'

export interface ParsedSearch {
  mode: SearchMode
  term: string
  raw: string
}

export interface SearchCommandDefinition {
  /** The search mode this command invokes. */
  mode: SearchMode
  /** The slash token typed in the search bar, e.g. '/genre'. */
  keyword: string
  /** Short display name, e.g. 'Genre'. */
  label: string
  /** One-line explanation of what the command searches by. */
  description: string
  /** A realistic example, shown in placeholders/usage messages. */
  example: string
}

/**
 * Every slash command the search bar recognizes. `SearchMode.Track` is
 * intentionally absent — it's the implicit fallback for input that matches
 * no command here, not an invokable command itself.
 *
 * To add a new command: add a `SearchMode` value in `src/types/search.ts`,
 * add an entry here, then add the matching search function to
 * `src/api/discogs/search.ts`'s `discogsSearchApi` map. Nothing else in the
 * parsing/orchestration layer needs to change.
 */
export const SEARCH_COMMANDS: readonly SearchCommandDefinition[] = [
  {
    mode: SearchMode.Genre,
    keyword: '/genre',
    label: 'Genre',
    description: 'Search releases by genre',
    example: '/genre rock',
  },
  {
    mode: SearchMode.Style,
    keyword: '/style',
    label: 'Style',
    description: 'Search releases by style',
    example: '/style acid',
  },
  {
    mode: SearchMode.Vibe,
    keyword: '/vibe',
    label: 'Vibe',
    description: 'Describe a listening vibe and let Claude find matching genres/styles',
    example: '/vibe rainy day lo-fi study session',
  },
]

const QUOTED_VALUE = /^(["'])([\s\S]*)\1$/

function unwrapQuotes(value: string): string {
  const match = QUOTED_VALUE.exec(value)
  return match ? match[2]! : value
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function commandPattern(keyword: string): RegExp {
  return new RegExp(`^${escapeRegExp(keyword)}(?:\\s+([\\s\\S]*))?$`, 'i')
}

export function parseSearchCommand(input: string): ParsedSearch {
  const raw = input.trim()

  for (const command of SEARCH_COMMANDS) {
    const match = commandPattern(command.keyword).exec(raw)
    if (!match) continue

    const term = unwrapQuotes((match[1] ?? '').trim())
      .replace(/\s+/g, ' ')
      .trim()

    return { mode: command.mode, term, raw }
  }

  return { mode: SearchMode.Track, term: raw, raw }
}

export function formatCommand(mode: SearchMode, value: string): string {
  const trimmed = value.trim()
  const command = SEARCH_COMMANDS.find((c) => c.mode === mode)

  if (!command) return trimmed

  return /\s/.test(trimmed) ? `${command.keyword} "${trimmed}"` : `${command.keyword} ${trimmed}`
}
