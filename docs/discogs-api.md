# Discogs API – Project Reference

Read this before working on: `src/views/SearchView.vue`, `src/views/GridView.vue`, `src/stores/discogs.ts`, `src/composables/useDiscogsAuth.ts`, `plugins/discogs-oauth.ts` — or anything else touching Discogs search, auth, or the results grid.

## Docs

https://www.discogs.com/developers

## Base URL

`https://api.discogs.com`

## User-Agent Requirement

- **Must** be supplied on every request (RFC 1945 format).
- Bad/missing User-Agent → empty response or silent block.
- `User-Agent` is a **forbidden header** in browser `fetch()` — cannot be set client-side.
- **Solution**: Vite dev-server proxy (`/api/discogs → https://api.discogs.com`) injects the header server-side.
- Current User-Agent value: `VueDiscogsExplorer/0.1 +https://github.com/example/vue-discogs-explorer`
- Change this to something unique for the real app (keep it uniquely identifiable).

## Proxy Config (vite.config.ts)

```ts
server: {
  proxy: {
    '/api/discogs': {
      target: 'https://api.discogs.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/discogs/, ''),
      headers: {
        'User-Agent': 'VueDiscogsExplorer/0.1 +https://github.com/example/vue-discogs-explorer',
      },
    },
  },
},
```

For production a backend proxy (e.g. Node/Express) will be needed to keep the User-Agent injection.

## Rate Limits

- Unauthenticated: **25 req/min** (moving average, 60 s window)
- Authenticated: **60 req/min**
- Response headers: `X-Discogs-Ratelimit`, `X-Discogs-Ratelimit-Used`, `X-Discogs-Ratelimit-Remaining`

## Authentication

- OAuth 2-legged (Discogs Auth Flow) or full OAuth 1.0a.
- Register app at: https://www.discogs.com/settings/developers
- Unauthenticated requests can read public data but the **search endpoint requires auth**.

## Key Endpoints

| Endpoint                     | Auth required | Notes                                         |
| ----------------------------- | ------------- | ---------------------------------------------- |
| `GET /releases/{id}`         | No            | Single release by numeric ID                  |
| `GET /artists/{id}`          | No            | Single artist by numeric ID                   |
| `GET /labels/{id}`           | No            | Single label by numeric ID                    |
| `GET /masters/{id}`          | No            | Master release by numeric ID                  |
| `GET /database/search?q=...` | **Yes**       | Full-text search; returns 401 unauthenticated |

## Accept Header (versioning)

```
Accept: application/vnd.discogs.v2.plaintext+json
Accept: application/vnd.discogs.v2.html+json
Accept: application/vnd.discogs.v2.discogs+json  (default)
```

## Pagination

`?page=2&per_page=75` (max 100). Response includes `pagination` object and `Link` header.

## Search Result Schema

The `GET /database/search` response returns:

```ts
interface DiscogsResult {
  id: number
  title: string // "Artist - Release Title"
  type: string // "release" | "master" | "artist" | "label"
  year?: string
  country?: string
  genre?: string[] // e.g. ["Rock", "Non-Music"]
  style?: string[] // e.g. ["Grunge", "Interview"]
  format?: string[] // e.g. ["DVD", "PAL"]
  label?: string[] // e.g. ["Eagle Vision"]
  catno?: string // catalogue number
  uri: string // relative path, e.g. "/Nirvana-Nevermind/release/123"
  resource_url: string // full API URL
  community?: {
    want: number
    have: number
  }
}

interface DiscogsPagination {
  per_page: number
  pages: number
  page: number
  items: number
  urls?: { last?: string; next?: string; prev?: string; first?: string }
}
```

`genre`, `style`, `format`, and `label` are **always arrays** — join them before display.

## Authentication Implementation (dev)

Full **OAuth 1.0a** flow implemented as a Vite plugin (`plugins/discogs-oauth.ts`) using the `oauth` npm package.

### Dev-server endpoints

| Method     | Path                     | Purpose                                                     |
| ---------- | ------------------------ | ------------------------------------------------------------ |
| `POST`     | `/auth/discogs/login`    | Start flow — returns `{ authorizeUrl }` for redirect         |
| `GET`      | `/auth/discogs/callback` | Discogs redirects here after user grants access              |
| `GET`      | `/auth/discogs/status`   | Returns `{ authenticated: boolean }`                          |
| `GET/POST` | `/api/discogs/*`         | Authenticated proxy — signs every request with OAuth tokens  |

### Notes

- Tokens are stored **in-memory** inside the Vite plugin — lost on Vite restart.
- `pendingTokenSecrets` map stores request token → secret during the handshake.
- On callback success the plugin redirects to `/` (root of the SPA).
- The proxy middleware is on `/api/discogs` and returns `401` if not authenticated.
- `oauth` package is used with `HMAC-SHA1` signing.

### `useDiscogsAuth` composable (`src/composables/useDiscogsAuth.ts`)

```ts
const { authenticated, login, logout } = useDiscogsAuth()
```

- `authenticated` — reactive ref; initialised from `sessionStorage` so it survives page refreshes within the same tab.
- `login()` — POSTs to `/auth/discogs/login`, then redirects `window.location.href` to the returned `authorizeUrl`.
- `logout()` — clears `authenticated` and removes the `sessionStorage` key.
- On mount, calls `/auth/discogs/status` and syncs `sessionStorage` accordingly (handles Vite restarts).

### Plugin config (in `vite.config.ts`)

```ts
discogsOAuthPlugin({
  consumerKey: process.env.DISCOGS_CONSUMER_KEY,
  consumerSecret: process.env.DISCOGS_CONSUMER_SECRET,
  requestTokenUrl: 'https://api.discogs.com/oauth/request_token',
  accessTokenUrl: 'https://api.discogs.com/oauth/access_token',
  authorizeUrl: 'https://www.discogs.com/oauth/authorize',
  callbackUrl: 'http://localhost:5173/auth/discogs/callback',
  userAgent: 'VueDiscogsExplorer/0.1 +https://github.com/example/vue-discogs-explorer',
})
```

Register your app and get keys at: https://www.discogs.com/settings/developers

## Current Feature Status

- `SearchView.vue` → chat-style Discogs search UI: fixed bottom input bar + scrollable results area.
  - Uses `useDiscogsAuth` to gate the UI behind OAuth login.
  - On successful search, writes results to `useDiscogsStore` (Pinia) in addition to displaying raw JSON.
- `GridView.vue` → AG Grid table that reads from `useDiscogsStore` and displays Discogs result columns.
- `src/stores/discogs.ts` → Pinia store holding `results[]` and `pagination`; shared between SearchView and GridView.
- `plugins/discogs-oauth.ts` → Vite dev-server plugin handling the full OAuth 1.0a flow.
