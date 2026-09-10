import type {
  ContentBlock,
  MessageCreateParams,
  MessageParam,
  TextBlockParam,
  Tool,
} from '@anthropic-ai/sdk/resources/messages'
import { claudeRequest } from './client'
import type { ClaudeResponse } from './client'

export interface RawMessagesData {
  content: ContentBlock[]
}

export interface SendMessageOptions {
  system?: string | TextBlockParam[]
  tools?: Tool[]
  tool_choice?: MessageCreateParams['tool_choice']
}

export function sendMessage(
  messages: MessageParam[],
  options?: SendMessageOptions,
): Promise<ClaudeResponse<RawMessagesData>> {
  return claudeRequest('/api/claude/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, ...options }),
  })
}

export function sendPrompt(prompt: string): Promise<ClaudeResponse<RawMessagesData>> {
  return sendMessage([{ role: 'user', content: prompt }])
}
