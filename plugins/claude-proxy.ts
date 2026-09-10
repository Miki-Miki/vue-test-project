import type { Plugin } from 'vite'
import Anthropic from '@anthropic-ai/sdk'
import type { MessageCreateParams, MessageParam, TextBlockParam, Tool } from '@anthropic-ai/sdk/resources/messages'

export interface ClaudeProxyConfig {
  apiKey: string
  model: string
}

interface ClaudeMessagesRequestBody {
  messages: MessageParam[]
  system?: string | TextBlockParam[]
  tools?: Tool[]
  tool_choice?: MessageCreateParams['tool_choice']
}

function readRequestBody(req: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    req.on('error', reject)
  })
}

export function claudeProxyPlugin(config: ClaudeProxyConfig): Plugin {
  const client = new Anthropic({ apiKey: config.apiKey })

  return {
    name: 'claude-proxy',
    configureServer(server) {
      // Authenticated proxy — keeps the API key server-side only
      server.middlewares.use('/api/claude/messages', (req, res, next) => {
        if (req.method !== 'POST') return next()

        void (async () => {
          try {
            const rawBody = await readRequestBody(req)
            const body = JSON.parse(rawBody) as ClaudeMessagesRequestBody

            const response = await client.messages.create({
              model: config.model,
              // Every call through this proxy forces tool use (tool_choice), so the
              // response is always a handful of short JSON fields — no need for a large cap.
              max_tokens: 256,
              messages: body.messages,
              ...(body.system ? { system: body.system } : {}),
              ...(body.tools ? { tools: body.tools } : {}),
              ...(body.tool_choice ? { tool_choice: body.tool_choice } : {}),
            })

            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ content: response.content }))
          } catch (err) {
            if (err instanceof Anthropic.APIError) {
              console.error('Claude API error:', err.status, err.message)
              res.writeHead(err.status ?? 502, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: err.message }))
              return
            }
            console.error('Claude proxy error:', err)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Unexpected error calling Claude' }))
          }
        })()
      })
    },
  }
}
