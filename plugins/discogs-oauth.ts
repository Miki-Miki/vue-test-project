import type { Plugin } from 'vite'
import { OAuth } from 'oauth'

export interface DiscogsOAuthConfig {
  consumerKey: string
  consumerSecret: string
  requestTokenUrl: string
  accessTokenUrl: string
  authorizeUrl: string
  callbackUrl: string
  userAgent: string
}

export function discogsOAuthPlugin(config: DiscogsOAuthConfig): Plugin {
  // In-memory token store — dev only, lost on Vite restart
  let accessToken: string | null = null
  let accessTokenSecret: string | null = null
  const pendingTokenSecrets: Record<string, string> = {}

  const oa = new OAuth(
    config.requestTokenUrl,
    config.accessTokenUrl,
    config.consumerKey,
    config.consumerSecret,
    '1.0',
    config.callbackUrl,
    'HMAC-SHA1',
    undefined,
    {
      'User-Agent': config.userAgent,
      Accept: 'application/vnd.discogs.v2.plaintext+json',
    },
  )

  return {
    name: 'discogs-oauth',
    configureServer(server) {
      // Step 1 — client POSTs here to begin the OAuth flow
      server.middlewares.use('/auth/discogs/login', (req, res, next) => {
        if (req.method !== 'POST') return next()
        oa.getOAuthRequestToken((err, token, secret) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: err }))
            return
          }
          pendingTokenSecrets[token] = secret
          const authorizeUrl = `${config.authorizeUrl}?oauth_token=${token}`
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ authorizeUrl }))
        })
      })

      // Step 2 — Discogs redirects here after the user grants access
      server.middlewares.use('/auth/discogs/callback', (req, res) => {
        const url = new URL(req.url!, config.callbackUrl)
        const oauthToken = url.searchParams.get('oauth_token')
        const oauthVerifier = url.searchParams.get('oauth_verifier')

        if (!oauthToken || !oauthVerifier || !pendingTokenSecrets[oauthToken]) {
          res.writeHead(400)
          res.end('Missing or invalid OAuth parameters')
          return
        }

        const tokenSecret = pendingTokenSecrets[oauthToken]
        delete pendingTokenSecrets[oauthToken]

        oa.getOAuthAccessToken(oauthToken, tokenSecret, oauthVerifier, (err, token, secret) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: err }))
            return
          }
          accessToken = token
          accessTokenSecret = secret
          res.writeHead(302, { Location: '/' })
          res.end()
        })
      })

      // Status check — used by the client to show/hide the login prompt
      server.middlewares.use('/auth/discogs/status', (_req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ authenticated: !!accessToken }))
      })

      // Authenticated API proxy — signs every request with OAuth
      server.middlewares.use('/api/discogs', (req, res) => {
        if (!accessToken || !accessTokenSecret) {
          res.writeHead(401, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Not authenticated. Connect to Discogs first.' }))
          return
        }

        const targetUrl = `https://api.discogs.com${req.url ?? '/'}`

        oa.get(targetUrl, accessToken, accessTokenSecret, (err, data, response) => {
          if (err) {
            const status = (err as { statusCode?: number }).statusCode ?? 502
            res.writeHead(status, { 'Content-Type': 'application/json' })
            res.end(typeof err === 'string' ? err : JSON.stringify(err))
            return
          }
          const contentType =
            (response as { headers?: Record<string, string> })?.headers?.['content-type'] ??
            'application/json'
          res.writeHead((response as { statusCode?: number })?.statusCode ?? 200, {
            'Content-Type': contentType,
          })
          res.end(data)
        })
      })
    },
  }
}
