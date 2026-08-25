import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import vuetify from 'vite-plugin-vuetify'
import { discogsOAuthPlugin } from './plugins/discogs-oauth'
import { claudeProxyPlugin } from './plugins/claude-proxy'

const CALLBACK_URL = 'http://localhost:5173/auth/discogs/callback'
const USER_AGENT = 'VueDiscogsExplorer/0.1 +https://github.com/example/vue-discogs-explorer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      vueJsx(),
      vueDevTools(),
      vuetify(),
      discogsOAuthPlugin({
        consumerKey: env.DISCOGS_CONSUMER_KEY,
        consumerSecret: env.DISCOGS_CONSUMER_SECRET,
        requestTokenUrl: env.DISCOGS_REQUEST_TOKEN_URL,
        accessTokenUrl: env.DISCOGS_ACCESS_TOKEN_URL,
        authorizeUrl: env.DISCOGS_AUTHORIZE_URL,
        callbackUrl: CALLBACK_URL,
        userAgent: USER_AGENT,
      }),
      claudeProxyPlugin({
        apiKey: env.CLAUDE_API_KEY,
        model: env.CLAUDE_MODEL,
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
