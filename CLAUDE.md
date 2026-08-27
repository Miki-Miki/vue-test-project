# vue-test-project (Vue Discogs Explorer)

Vue 3 + Vite + TypeScript SPA for searching the Discogs music database: a chat-style search view backed by OAuth-authenticated Discogs API calls, with results also viewable in an AG Grid table. State is managed with Pinia.

## Commands

- `npm run dev` — start the Vite dev server (also runs the Discogs OAuth proxy plugin)
- `npm run build` — type-check then build for production
- `npm run type-check` — `vue-tsc --build`
- `npm run lint` — oxlint + eslint, both with `--fix`
- `npm run format` — prettier over `src/`

## Styling / UI conventions

[src/CLAUDE.md](src/CLAUDE.md) is the entry point and loads automatically whenever you work under `src/`. It routes to two places: [.claude/rules/styling-structure.md](.claude/rules/styling-structure.md) (selector naming, ITCSS layout, component folders — always in effect) and the `styling-design-system` skill (tokens, colors, dark theme, component recipes — loaded on demand for actual visual/design decisions).

## Generic component naming

Generic/reusable components (results grid, detail panel, etc.) must not carry provider-specific names in their types, props, or internal variables — see [.claude/rules/component-naming.md](.claude/rules/component-naming.md) (always in effect). Provider-specific naming is reserved for the actual integration layer (`src/stores/discogs.ts`, `useDiscogsAuth.ts`, `plugins/discogs-oauth.ts`).

## Discogs API feature work

Before touching Discogs search, auth, or the results grid — `src/views/SearchView.vue`, `src/views/GridView.vue`, `src/stores/discogs.ts`, `src/composables/useDiscogsAuth.ts`, `src/composables/useSearchQuery.ts`, `src/utils/searchCommand.ts`, `src/api/discogs/`, or `plugins/discogs-oauth.ts` — read [docs/discogs-api.md](docs/discogs-api.md) first. It covers the API base URL, the User-Agent proxy workaround, rate limits, the OAuth 1.0a flow, endpoints, and response schemas.

## Writing tests

Before writing or generating new unit tests, or extending existing ones under any `__tests__/` directory, read [docs/testing-conventions.md](docs/testing-conventions.md) first. It covers where to mock (and where not to), which failure/edge paths must be paired with happy-path tests, how to control non-determinism like `Date.now()`, and which existing spec files are strong templates to copy vs. which ones not to imitate.

## Testing UI changes

End-to-end / browser-driven testing (launching a dev server, driving a real or headless browser, installing Playwright or similar) is done by a human, not Claude. Never attempt to spin up a browser, install browser-automation tooling, or otherwise run an e2e test for a feature — rely on type-checking, unit tests, and static reasoning about the diff instead, and say explicitly that manual/browser verification is left to the user.

## Claude Code configuration (`.claude/`)

```
.claude/
├── settings.json           # team-shared config (permissions, MCP servers) — committed
├── settings.local.json     # personal/machine overrides — gitignored, do not rely on it for team behavior
├── rules/                  # always-loaded structural rules, injected alongside CLAUDE.md
│   ├── styling-structure.md # selector naming, ITCSS layout, component-folder convention
│   └── component-naming.md # generic vs. provider-specific naming for components/types/variables
├── agents/                 # subagents: focused, tool-scoped workers for specific jobs
│   └── ui-designer.md      # turns a submitted UI screenshot into Vue components matching the design system
└── skills/                 # skills: on-demand instructions Claude loads only when relevant/invoked
    ├── styling-design-system/
    │   └── SKILL.md        # design tokens, colors, typography, dark theme, component recipes (badges, buttons, AG Grid)
    └── ui-from-screenshot/
        ├── SKILL.md        # entry point — kept short; delegates implementation to the ui-designer agent
        └── reference/      # deeper reference material as it accumulates (empty until needed)
```

- **`rules/`** vs **`skills/`**: both are project instructions, but `rules/*.md` files are injected every relevant turn just like CLAUDE.md — reserve them for things that must hold on *every* edit in their scope (e.g. selector naming must never be violated). `skills/*/SKILL.md` only load when their `description` matches the task (or on explicit invocation) — use them for reference material that's only needed for specific kinds of changes (e.g. design tokens are irrelevant to a purely structural rename).
- **`agents/`** vs **`skills/`**: a skill is *when to do something* (auto-loaded by its `description`, or invoked as `/skill-name`); an agent is *who does it* (a subagent with its own tool access and context window). The `ui-from-screenshot` skill is the entry point a request matches against; it delegates the actual component-writing work to the `ui-designer` agent.
- Keep `src/CLAUDE.md` itself thin — a router to the always-loaded rule(s) and relevant skill(s), not a place to accumulate reference content directly. Move exhaustive reference material (design tokens, screenshot-to-component mappings, etc.) into a skill instead of growing `src/CLAUDE.md` or a rules file further; skill bodies only load into context when used, rules/CLAUDE.md files load on every relevant turn.
- Follow the same `docs/*.md`-linked-from-CLAUDE.md pattern already used for `docs/discogs-api.md` and `docs/testing-conventions.md` when adding new project-wide reference docs that aren't tied to a specific skill.
