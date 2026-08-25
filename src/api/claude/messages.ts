import type { ContentBlock, MessageParam } from '@anthropic-ai/sdk/resources/messages'
import { claudeRequest } from './client'
import type { ClaudeResponse } from './client'

export interface RawMessagesData {
  content: ContentBlock[]
}

export function sendMessage(messages: MessageParam[]): Promise<ClaudeResponse<RawMessagesData>> {
  return claudeRequest('/api/claude/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
}

export function sendPrompt(prompt: string): Promise<ClaudeResponse<RawMessagesData>> {
  return sendMessage([{ role: 'user', content: prompt }])
}
