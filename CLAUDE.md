# vue-test-project (Vue Discogs Explorer)

Vue 3 + Vite + TypeScript SPA for searching the Discogs music database: a chat-style search view backed by OAuth-authenticated Discogs API calls, with results also viewable in an AG Grid table. State is managed with Pinia.

## Commands

- `npm run dev` — start the Vite dev server (also runs the Discogs OAuth proxy plugin)
- `npm run build` — type-check then build for production
- `npm run type-check` — `vue-tsc --build`
- `npm run lint` — oxlint + eslint, both with `--fix`
- `npm run format` — prettier over `src/`

## Styling / UI conventions

Design-system rules (spacing, colors, dark theme, AG Grid theming, component recipes) live in [src/CLAUDE.md](src/CLAUDE.md) and load automatically whenever you work under `src/`.

## Discogs API feature work

Before touching Discogs search, auth, or the results grid — `src/views/SearchView.vue`, `src/views/GridView.vue`, `src/stores/discogs.ts`, `src/composables/useDiscogsAuth.ts`, or `plugins/discogs-oauth.ts` — read [docs/discogs-api.md](docs/discogs-api.md) first. It covers the API base URL, the User-Agent proxy workaround, rate limits, the OAuth 1.0a flow, endpoints, and response schemas.

## Writing tests

Before writing or generating new unit tests, or extending existing ones under any `__tests__/` directory, read [docs/testing-conventions.md](docs/testing-conventions.md) first. It covers where to mock (and where not to), which failure/edge paths must be paired with happy-path tests, how to control non-determinism like `Date.now()`, and which existing spec files are strong templates to copy vs. which ones not to imitate.
