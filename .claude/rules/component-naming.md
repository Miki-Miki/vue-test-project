# Generic Component Naming Standard

Generic, reusable components — anything not inherently tied to one specific external provider or API — must use domain-neutral names for their types, props, and internal variables. This applies to the type/variable/identifier level, not just file names: always in effect, regardless of what specific feature is being built.

## Rule

1. **Identify the provider-integration layer.** Code whose entire purpose is talking to one specific external API is provider-specific by nature and keeps that provider's name: the Pinia store that owns the fetch calls (e.g. `useDiscogsStore`, `src/stores/discogs.ts`), auth composables (`useDiscogsAuth.ts`), API proxy plugins (`plugins/discogs-oauth.ts`), and reference docs (`docs/discogs-api.md`).
2. **Everything else is generic UI** and must not carry that provider's name in its types, props, computed/variable names, or emitted event payloads — even if, today, it happens to only be fed by that one provider. Components like a results grid or a detail panel are generic display components; they don't stop being generic just because the current data source is Discogs.
3. **Shared data shapes used by generic components** live in `src/types/` (e.g. `src/types/search.ts`), named for what they represent (`SearchResult`, `SearchPagination`), not for where the data came from (`DiscogsResult`, `DiscogsPagination`). The provider-integration layer imports and populates these generic types — it does not define its own parallel provider-named type for data it hands to generic components.
4. **Internal identifiers follow the same rule.** A computed property that builds a link out to the specific provider's website is fine to reference that provider in a **UI string** (e.g. a button labeled "View on Discogs" is accurate, real copy) — but the **variable/computed name** backing it should stay generic (`resultUrl`, not `discogsUrl`), since the component itself is not provider-specific.

## Why

Provider-specific names on generic components leak an implementation detail into code that shouldn't need to know it, and make it harder to reuse or extend those components (e.g. adding a second data source) without a misleading rename. Keeping the naming boundary at the actual integration layer makes it obvious, just from a type or variable name, whether a piece of code is provider-bound or freely reusable.

## Example

- `src/types/search.ts` — `SearchResult`, `SearchPagination`, `SearchMode` (generic, provider-agnostic)
- `src/stores/discogs.ts` — `useDiscogsStore`, the Discogs-specific integration layer; imports and populates the generic types above
- `src/views/GridView/GridView.vue`, `src/components/DetailPanel/DetailPanel.vue` — generic display components; consume `SearchResult`, never `DiscogsResult`
