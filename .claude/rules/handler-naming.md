# Handler Function Naming Standard

Functions that handle an event — a user interaction, an emitted component event, a DOM event, etc. — must be named so the name alone tells you what is being handled. This applies to every event handler function, regardless of what specific feature is being built: always in effect.

## Rule

1. **Every handler is prefixed with `handle`.** No bare verb names (`toggle`, `select`, `close`) and no bare `on*` names (`onWheel`, `onSelect`) as the function's own identifier — those are reserved for the *prop/emit* name being bound to (e.g. `@wheel="handleWheel"`, an emit payload named `select`), not the function implementation.
2. **The rest of the name describes what is being handled, in as few words as possible.** Favor the specific thing the handler acts on over a generic restatement of the event type alone — `handleDetailPanelToggle`, not `handleToggle`, when the function toggles the detail panel specifically.
3. **Keep it to a minimal, unambiguous phrase.** Don't pad with implementation detail or restate the whole call site; the goal is a name a reader can understand without opening the function body, not a full sentence.

## Examples

- `toggle(result)` → `handleDetailPanelToggle(result)`
- `onWheel(event)` → `handleOnWheel(event)`
- A generic `onSelect` prop callback in a view that selects a search result and opens the detail panel → `handleResultSelect`

## Why

A bare verb (`toggle`, `close`) or a bare `on*` name tells you an event fired, not what the code actually does in response — the reader has to open the function body (or trace where it's bound) to find out. Prefixing with `handle` and naming the subject makes the handler self-describing at every call site and in stack traces.
