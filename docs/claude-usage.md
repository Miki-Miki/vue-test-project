# Claude Usage in This App – Overview

This app calls Claude (Anthropic) in two places, both to turn free-form context into a
constrained pick from Discogs' fixed genre/style taxonomy via forced tool use. Both share
the same proxy and HTTP layer.

## Shared infrastructure

```
Browser SPA --fetch--> /api/claude/messages --> plugins/claude-proxy.ts --> Anthropic.messages.create
```

- **`plugins/claude-proxy.ts`** — a Vite dev-server plugin (`configureServer` hook, dev-only)
  that holds `CLAUDE_API_KEY`/`CLAUDE_MODEL` (from `vite.config.ts`'s `claudeProxyPlugin({...})`,
  sourced from env) and exposes `POST /api/claude/messages`, forwarding
  `{ messages, system?, tools?, tool_choice? }` straight to `Anthropic.messages.create`. The key
  never reaches the browser bundle — same pattern as the Discogs OAuth proxy. **A production
  deploy needs a real backend equivalent before this ships**, since Vite plugins only run under
  `vite dev`.
- **`src/api/claude/client.ts`** — generic `claudeRequest` fetch/normalize helper (mirrors
  `src/api/discogs/client.ts`).
- **`src/api/claude/messages.ts`** — `sendMessage(messages, options?)` posts to
  `/api/claude/messages`; the only thing that calls the proxy. No Discogs or feature knowledge.
- **`src/api/discogs/taxonomyPrompt.ts`** — shared helpers both features use to build the prompt:
  `taxonomyFor(mode)` (raw `DISCOGS_GENRES`/`DISCOGS_STYLES` from `src/data/discogsTaxonomy.ts`),
  `formatTaxonomyWithVibes(mode)` (one line per value, `"Ambient: Slow-moving, atmospheric..."`,
  vibes from `src/data/discogsTaxonomyVibes.ts`), and `toSearchMode`/`facetKey` for
  validating/deduping tool output.

## How tool use is configured

Every call follows the same shape: build a `Tool` with a strict JSON Schema, then force Claude to
call it via `tool_choice: { type: 'tool', name: '<tool name>' }` — this guarantees structured
output instead of parsing free-form text. The response is read from
`content.find(block => block.type === 'tool_use').input`, then validated against the taxonomy
(every `value` must exact-match an entry in `DISCOGS_GENRES`/`DISCOGS_STYLES`) before use.
Validation failure throws — callers surface an error state, never a silently-coerced guess.

## Call site 1 — next-search suggestions (`src/api/discogs/suggestions.ts`)

`suggestNextSearches(history: string[])` — used by the Tree view's `SuggestionPicker` to propose
3 next genre/style picks given the ordered chain of searches so far. Tool: `suggest_searches`,
input `{ suggestions: [{mode, value}] x3 }` (exactly 3, enforced by `minItems`/`maxItems` and
re-checked after parsing). Wired up via `useSearchSuggestions.ts` (module-singleton
`suggestions`/`loading`/`error`/`refresh`), called by `TreeView.vue` on every history change.
Clicking a suggestion runs `searchByCommand(mode, value)` — identical to typing `/genre X`.

Full detail (system prompt, exact rules, validation, click-to-search wiring):
[docs/claude-suggestions.md](./claude-suggestions.md).

## Call site 2 — vibe search (`src/api/discogs/vibeSearch.ts`)

Powers `/vibe <free text>` search: translates an open-ended vibe description into a concrete set
of genres/styles, then lets the user refine that set by picking one of the results' tags.

- **`generateVibeSearch(vibePrompt: string)`** — tool `select_vibe_facets`, input
  `{ facets: [{mode, value}] x2-7 }`. System prompt instructs Claude to prefer styles over genres
  (more precise, less repetitive) and pick 2–7 facets that together capture the vibe.
- **`refineVibeSearch(previousFacets, shownResults, picked)`** — tool `select_refined_vibe_facets`,
  same schema. Given the previous facet set, the genre/style tags seen in the last shown results,
  and a facet the user just picked, it returns a new 2–7 facet set that: strongly anchors on the
  previous facets, must include the picked facet, and replaces only 1–4 of the previous facets.
  `refineVibeSearch` additionally validates the replaced-count bound (`MIN_REPLACED`/
  `MAX_REPLACED` = 1–4) and that the picked facet survived, on top of the shared taxonomy check.

Both are called from `useVibeSearch.ts` (`startVibeSearch`/`pickSuggestion`), which turns the
returned facets into a Discogs search via `searchByFacets` and pushes results into the same
`discogs`/`searchHistory` stores a normal search would.

## Where each lives, at a glance

| Concern                         | File |
|----------------------------------|------|
| API key / model / proxy route    | `plugins/claude-proxy.ts`, `vite.config.ts` |
| Generic Claude HTTP layer        | `src/api/claude/client.ts`, `src/api/claude/messages.ts` |
| Shared taxonomy/prompt helpers   | `src/api/discogs/taxonomyPrompt.ts` |
| Next-search suggestions          | `src/api/discogs/suggestions.ts`, `src/composables/useSearchSuggestions.ts`, `src/components/SuggestionPicker/` |
| Vibe search                      | `src/api/discogs/vibeSearch.ts`, `src/composables/useVibeSearch.ts` |

Both feature files (`suggestions.ts`, `vibeSearch.ts`) live in `src/api/discogs/` rather than
`src/api/claude/` — they're Discogs-domain integration code (the only layer allowed to know the
taxonomy and build a Discogs-flavored prompt around it), not generic Claude plumbing.
