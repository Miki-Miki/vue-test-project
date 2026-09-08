import type { SearchSuggestion } from '@/types/search'
import { sendMessage } from '@/api/claude/messages'
import { SUGGEST_SEARCHES_TOOL, SYSTEM_PROMPT } from './suggestionsConstants'
import { buildUserMessage, parseSuggestions } from './suggestionsUtils'

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
