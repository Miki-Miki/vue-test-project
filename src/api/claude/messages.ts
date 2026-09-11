import type {
  ContentBlock,
  MessageCreateParams,
  MessageParam,
  TextBlockParam,
  Tool,
} from '@anthropic-ai/sdk/resources/messages'
import { claudeRequest } from './client'
import type { ClaudeResponse } from './client'
import { mockToolUseResponse } from './mockClient'

export interface RawMessagesData {
  content: ContentBlock[]
}

export interface SendMessageOptions {
  system?: string | TextBlockParam[]
  tools?: Tool[]
  tool_choice?: MessageCreateParams['tool_choice']
}

/**
 * VITE_MOCK_CLAUDE=true (set in a gitignored .env.local) stands in for an
 * expired/missing Claude API key during development — remove the env var to
 * go back to real Claude calls.
 */
export function sendMessage(
  messages: MessageParam[],
  options?: SendMessageOptions,
): Promise<ClaudeResponse<RawMessagesData>> {
  if (import.meta.env.VITE_MOCK_CLAUDE === 'true') {
    return Promise.resolve(mockToolUseResponse(messages, options))
  }

  return claudeRequest('/api/claude/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, ...options }),
  })
}

export function sendPrompt(prompt: string): Promise<ClaudeResponse<RawMessagesData>> {
  return sendMessage([{ role: 'user', content: prompt }])
}
