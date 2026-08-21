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

## Claude Code configuration (`.claude/`)

```
.claude/
├── settings.json           # team-shared config (permissions, MCP servers) — committed
├── settings.local.json     # personal/machine overrides — gitignored, do not rely on it for team behavior
├── agents/                 # subagents: focused, tool-scoped workers for specific jobs
│   └── ui-designer.md      # turns a submitted UI screenshot into Vue components matching the design system
└── skills/                 # skills: on-demand instructions Claude loads only when relevant/invoked
    └── ui-from-screenshot/
        ├── SKILL.md        # entry point — kept short; delegates implementation to the ui-designer agent
        └── reference/      # deeper reference material as it accumulates (empty until needed)
```

- **`agents/`** vs **`skills/`**: a skill is *when to do something* (auto-loaded by its `description`, or invoked as `/skill-name`); an agent is *who does it* (a subagent with its own tool access and context window). The `ui-from-screenshot` skill is the entry point a request matches against; it delegates the actual component-writing work to the `ui-designer` agent.
- Keep `src/CLAUDE.md` for design rules that must apply to *every* edit under `src/` (tokens, spacing, AG Grid theming). Move anything that's reference material rather than a hard rule — e.g. exhaustive screenshot-to-component mappings — into `.claude/skills/ui-from-screenshot/reference/` instead of growing `src/CLAUDE.md` further; skill bodies only load into context when used, CLAUDE.md files load on every relevant turn.
- Follow the same `docs/*.md`-linked-from-CLAUDE.md pattern already used for `docs/discogs-api.md` and `docs/testing-conventions.md` when adding new project-wide reference docs that aren't tied to a specific skill.
