# Discogs API – Project Reference

Read this before working on: `src/views/SearchView.vue`, `src/views/GridView.vue`, `src/stores/discogs.ts`, `src/composables/useDiscogsAuth.ts`, `src/composables/useSearchQuery.ts`, `src/utils/searchCommand.ts`, `src/api/discogs/`, `plugins/discogs-oauth.ts` — or anything else touching Discogs search, auth, or the results grid.

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

| Endpoint                                    | Auth required | Notes                                                        |
| -------------------------------------------- | ------------- | -------------------------------------------------------------- |
| `GET /releases/{id}`                        | No            | Single release by numeric ID                                 |
| `GET /artists/{id}`                         | No            | Single artist by numeric ID                                  |
| `GET /labels/{id}`                          | No            | Single label by numeric ID                                   |
| `GET /masters/{id}`                         | No            | Master release by numeric ID                                 |
| `GET /database/search?track=...`            | **Yes**       | Track-title search; returns 401 unauthenticated               |
| `GET /database/search?genre=...&type=release` | **Yes**     | Genre lookup, scoped to releases (see below); 401 unauthenticated |
| `GET /database/search?style=...&type=release` | **Yes**     | Style lookup, scoped to releases (see below); 401 unauthenticated |

## Search bar command syntax

The app's search bar (`src/composables/useSearchQuery.ts`) recognizes slash commands, registered in `src/utils/searchCommand.ts`'s `SEARCH_COMMANDS`:

- `nirvana` → ordinary track search, `?track=nirvana`
- `/genre rock` → genre lookup, `?genre=rock&type=release`
- `/style acid` → style lookup, `?style=acid&type=release`
- `/genre "hip hop"` (or `/style "new beat"`) → multi-word value, quoted or not, e.g. `?genre=hip%20hop&type=release`

`type=release` is required for genre/style lookups — only release-type results populate `genre`/`style`/`community.want`, which is what the grid displays. Anything other than a plain track search is sorted client-side by `community.want` descending (`rankByPopularity` in `src/utils/relevance.ts`) rather than by title relevance, since there's no meaningful title query to score against.

### Architecture: parsing vs. fetching are separate layers

- **`src/utils/searchCommand.ts`** is provider-agnostic — it only knows about command syntax (`SEARCH_COMMANDS`, `parseSearchCommand`, `formatCommand`), not Discogs URLs or `fetch`.
- **`src/api/discogs/`** is the only place that knows a Discogs URL or calls `fetch`: `search.ts` exports `searchTracks`/`searchByGenre`/`searchByStyle` and the `discogsSearchApi` mode→function map; `auth.ts` exports `fetchAuthStatus`/`login`; `client.ts` is the shared fetch/normalize helper both use.
- **`src/composables/useSearchQuery.ts`** ties the two together: it parses the input, then calls `discogsSearchApi[mode](term)` — it never builds a URL itself, which is what keeps the search architecture agnostic of which API backs it.

### Adding a new search command

1. Add a new `SearchMode` value in `src/types/search.ts`.
2. Add an entry to `SEARCH_COMMANDS` in `src/utils/searchCommand.ts` (keyword, label, description, example).
3. Add the matching search function to `src/api/discogs/search.ts` and register it in the `discogsSearchApi` map.

Nothing else needs to change — parsing, ranking (`GridView.vue`), the search-bar placeholder, and the composable all read from these three places generically.

## Accept Header (versioning)

```
Accept: application/vnd.discogs.v2.plaintext+json
Accept: application/vnd.discogs.v2.html+json
Accept: application/vnd.discogs.v2.discogs+json  (default)
```

## Pagination

`?page=2&per_page=75` (max 100). Response includes `pagination` object and `Link` header.

## Search Result Schema

The `GET /database/search` response is mapped onto the app's generic `SearchResult`/`SearchPagination` types (`src/types/search.ts` — see [.claude/rules/component-naming.md](../.claude/rules/component-naming.md) for why these aren't named `DiscogsResult`/`DiscogsPagination`: they're consumed by generic display components, not by provider-specific code):

```ts
interface SearchResult {
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

interface SearchPagination {
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
- `login()` — calls `src/api/discogs/auth.ts`'s `login()` (POSTs to `/auth/discogs/login`), then redirects `window.location.href` to the returned `authorizeUrl`.
- `logout()` — clears `authenticated` and removes the `sessionStorage` key (no network call).
- On mount, calls `src/api/discogs/auth.ts`'s `fetchAuthStatus()` (`GET /auth/discogs/status`) and syncs `sessionStorage` accordingly (handles Vite restarts). The composable itself never calls `fetch` directly — same separation as search (see above).

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

- `SearchBar.vue` → globally-mounted search input; delegates to `useSearchQuery` (`src/composables/useSearchQuery.ts`), which parses `/genre`/`/style` commands (from `SEARCH_COMMANDS`) and drives every search. Its placeholder text is generated from `SEARCH_COMMANDS` so it never drifts out of sync.
- `SearchView.vue` → chat-style Discogs search UI: fixed bottom input bar + scrollable results area.
  - Uses `useDiscogsAuth` to gate the UI behind OAuth login.
  - On successful search, writes results to `useDiscogsStore` (Pinia) in addition to displaying raw JSON.
- `GridView.vue` → AG Grid table that reads from `useDiscogsStore` and displays result columns; sorts by title relevance for plain track searches, by `community.want` for any command-based search (genre, style, ...).
- `DetailPanel.vue` → both genre and style tags are clickable and emit `commandSelect(mode, value)`, wired up in `GridView.vue` to call `useSearchQuery().searchByCommand(mode, value)`.
- `src/stores/discogs.ts` → Pinia store holding `results[]`, `pagination`, `lastQuery`, and `lastSearchMode`; shared between SearchView and GridView. Holds state only — never fetches.
- `src/api/discogs/` → the only layer that knows a Discogs URL or calls `fetch` (search + auth); see "Architecture" above.
- `plugins/discogs-oauth.ts` → Vite dev-server plugin handling the full OAuth 1.0a flow.
