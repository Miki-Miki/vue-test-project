# Testing Conventions – Project Reference

Read this before writing or generating new unit tests, or before extending existing ones under any `__tests__/` directory.

## Stack

- Jest 30 + `jsdom`, config in `jest.config.cjs`.
- `@vue/test-utils` for component/view mounting, `@vue/vue3-jest` for `.vue` transform.
- Coverage gate: **80%** branches/functions/lines/statements, collected over `src/components`, `src/views`, `src/App.vue`, `src/stores`, `src/composables`, `src/utils`.
- Shared setup in `src/test/setup.ts`: mocks `window.matchMedia` and clears `localStorage`/`sessionStorage`/theme attributes in a global `afterEach`.

## Mock at the real boundary, not deeper

The single biggest determinant of whether a test is trustworthy or a false positive is *where* the mocking happens.

- **Pinia stores: keep them real.** Use `setActivePinia(createPinia())` and exercise the actual store instance. Only mock a store's action with `jest.spyOn(store, 'action')` when you need to assert a call site — never replace the whole store with a hand-built object matching a shape you invented.
- **Composables that hit the network** (`useDiscogsAuth`, etc.): mock `global.fetch`, not the composable itself. When a component/view consumes the composable, the mock's returned shape (refs, functions) must match the real composable's return signature exactly — check the source file, don't guess it.
- **Heavy third-party UI** (AG Grid): stub the wrapper component (e.g. `AgGridVue`) at the `rowData`/`columnDefs`-in, `@row-clicked`-out boundary. Don't stub away the logic under test — column `valueFormatter`/`valueGetter` functions should still be invoked for real, either through the stub or by calling them directly as plain functions.
- Never mock `localStorage`/`sessionStorage` — jsdom provides a real implementation; use it and let `src/test/setup.ts`'s `afterEach` clear it between tests.

Before writing assertions against a mock, open the real source file it stands in for and confirm the mock's fields/return values match. A mock that drifts from its real counterpart is the most common way generated tests silently stop meaning anything.

## Always pair the happy path with a failure/edge path

Generated tests tend to cover the success case well and skip the branch that handles things going wrong. For every action/function under test, also cover at least one of:

- Network failure (`fetch` rejects, or resolves with a non-OK status)
- Storage failure (`localStorage.setItem`/`removeItem` throwing — e.g. quota exceeded)
- Missing/undefined optional fields feeding a `??` or `?.` fallback
- The "not found" / no-op branch of any lookup (e.g. `setActiveEntry` called with an unknown id)

If a `try/catch` exists in the source, there must be a test that actually enters the `catch` block — not just the `try` path.

## Control non-determinism explicitly

- If a store derives IDs or ordering from `Date.now()`, mock it with a **sequential** value per call (e.g. an incrementing counter), never a single hardcoded timestamp — two synchronous calls in the same test will otherwise collide and produce flaky ordering.
- Don't rely solely on the global `afterEach` in `src/test/setup.ts` for isolation that a test's own correctness depends on (e.g. theme `data-theme` attribute state). Prefer a local `beforeEach`/`afterEach` in the spec file when the test's pass/fail hinges on that cleanup, so the isolation guarantee is visible in the file itself.

## Query DOM the resilient way

Prefer tag/role/text-content queries (`find('button')`, text search) over CSS class or `findAll(...).at(n)` index lookups where the markup has no natural structural meaning. Structural queries (e.g. `findAll('dd')` inside a `<dl>`) are fine since the order is inherent to the markup, not incidental.

## What "good" looks like in this repo

These files are strong reference templates — copy their patterns rather than the weaker ones below:

- `src/components/__tests__/SearchBar.spec.ts` — async store-integrated component, every branch of the request lifecycle (empty-guard, loading, success, HTTP error, thrown exception) against real Pinia state.
- `src/components/__tests__/DetailPanel.spec.ts` — pure prop-driven component, no mocking needed, all `v-if`/`??`/`?.` branches covered.
- `src/views/__tests__/GridView.spec.ts` — AG Grid stubbed at the right altitude, column formatter/getter functions invoked directly.
- `src/stores/__tests__/searchHistory.spec.ts` — real localStorage round-trip, cross-store side effects, sequential `Date.now` mock.
- `src/composables/__tests__/useDiscogsAuth.spec.ts` — `fetch` mocked at the network boundary, module state reset per test via `jest.resetModules()`.

Don't use `src/components/__tests__/HelloWorld.spec.ts`, `TheWelcome.spec.ts`, or `AuthPrompt.spec.ts` as thoroughness templates — they're thin even relative to their small surface. If `HelloWorld.vue`/`TheWelcome.vue` turn out to be unused scaffold leftovers rather than real app UI, prefer deleting them (and their tests) over investing in more coverage.
