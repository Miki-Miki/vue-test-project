# Styling Structure Standard

Structural rules for how styles are organized and named across the project. These apply to every `<style>` block, co-located stylesheet, and shared style file — always in effect, regardless of what specific styling task is at hand. (For the actual design tokens, colors, spacing scale, and component recipes, see the `styling-design-system` skill instead — invoke it when making visual/design-token decisions.)

## 1. Selector naming (component-scoped styles)

Applies to every component's styles (`<style>` blocks and any co-located `.css`/`.scss` file).

1. **Root wrapper.** The template's outermost element gets one class equal to the file's kebab-case name (drop the extension). Nothing else goes on that root element's class list.
2. **Child selectors.** Every descendant selector is written as `&-child-name`, nested inside the root selector, so it compiles to `.file-name-child-name`. Multi-word child names use exactly one dash between words (kebab-case) — never `&__child` or `&--child` for structural children.
3. **Modifiers/state** (e.g. active, disabled, primary variants) also use `&-modifier-name` — this standard does not reserve a separate `--modifier` syntax. A selector like `&-active` or `&-primary` is just another child-style entry, kept flat under the same root.
4. **Nesting depth.** Nesting mirrors the DOM hierarchy: a child of the root nests one level as `&-child`, and a grandchild nests inside that as another `&-grandchild`, so `&-header { &-title { } }` compiles to `.file-name-header-title`. Each level only ever adds its own `&-segment` — never repeat an ancestor's segment name when nesting deeper.
5. **SCSS only.** This nesting relies on Sass's `&`. Plain `.css` files (no preprocessor) must write the fully expanded class names (`.file-name-header`) since `&` nesting isn't available — convert files that need this structure to `.scss`.
6. **No bare element/tag selectors.** Don't write rules keyed on an HTML tag (`button`, `input`, `a`, `img`, `dt`, `svg`, …) inside component-scoped styles, even nested under `&-child`. Every styled element gets its own `&-child-name` class instead, and the template applies that class directly to the tag. This holds regardless of how many elements of that tag exist in the template — a single `<input>` still gets its own `&-child` class, not a bare `input` selector. Tag selectors are fragile: they break the moment markup changes (a `<button>` swapped for a styled `<a>`, a second `<input>` added), and they silently escalate specificity/reach to *every* matching descendant instead of the one you meant. Exceptions: `:deep()` overrides into a third-party component's internal DOM (e.g. AG Grid) where you don't control the markup to add a class, and the shared `_reset.scss`/`_base.scss` ITCSS layers (§2), which are element-scoped by design.

### Example

File: `DetailPanel.vue` (or its co-located `DetailPanel.scss`)

```scss
.detail-panel {
  // root-level rules

  &-header {
    &-title {
    }
  }

  &-thumbnail {
    &-empty {
    }

    &-image {
    }
  }

  &-close-button {
    &-active {
    }
  }
}
```

```vue
<template>
  <aside class="detail-panel">
    <header class="detail-panel-header">
      <span class="detail-panel-header-title">Release Detail</span>
    </header>
    <div class="detail-panel-thumbnail">
      <img class="detail-panel-thumbnail-image" :src="thumb" />
      <div class="detail-panel-thumbnail-empty">♫</div>
    </div>
  </aside>
</template>
```

Note the `<img>` still gets its own `&-thumbnail-image` class rather than being styled via a bare `img` selector under `&-thumbnail` — see rule 6 above.

### Notes

- The root class name must match the file name exactly (kebab-case), even if the component is mounted somewhere with a different tag name — this is what makes the selector traceable back to its source file.
- Shared/reusable pieces that aren't tied to one file's structure (e.g. the generic `.btn`, `.badge` recipes documented in the `styling-design-system` skill) are exempt — this standard governs component-scoped structural selectors, not the shared design-system utility classes. These recipes live in `src/assets/styles/_components.scss` (see §2) — never duplicated inside a component's own scoped stylesheet, since Vue's `scoped` attribute would wall the rule off from every other component that also uses the class.
- When migrating an existing component, convert its stylesheet to `.scss` so the `&-` nesting is available, then flatten any existing BEM (`__`/`--`) selectors into this `&-` form.

## 2. Project structure (ITCSS)

Global styles follow a loose [ITCSS](https://itcss.io/) (Inverted Triangle CSS) layering — generic, low-specificity rules first, increasingly specific rules last. This governs the shared `styles/` folder only; it does not change the component-scoped `&-` naming standard above, which still applies inside every component's own stylesheet.

### `src/assets/styles/` layout

```
src/assets/styles/
├── main.scss         # entry point — @use every layer below, in order, nothing else
├── _variables.scss   # Settings: design tokens (CSS custom properties, color/spacing/font vars)
├── _reset.scss       # Generic: CSS reset / normalize, box-sizing — no project-specific values
├── _base.scss        # Base: bare element defaults (html, body, headings, links) — no classes
├── _objects.scss     # Objects: undecorated structural layout patterns (e.g. a generic list/stack/cluster)
├── _components.scss  # Components: shared, cosmetically-opinionated recipes reused by name across
│                      #   multiple components (.btn, .badge, .filter-tabs, …) — see styling-design-system skill
└── _utils.scss       # Utilities: small single-purpose helper classes that override anything below them (e.g. .sr-only, .text-truncate)
```

- **Layer order matters and is fixed**: variables → reset → base → objects → components → utils. Each layer may only be as specific as its position — don't put a class selector in `_base.scss`, don't put a component-shaped selector in `_objects.scss`.
- Partial files are prefixed with `_` and pulled in via `@use` from `main.scss` — never imported individually from a component or view.
- `variables` holds tokens only (custom properties / SCSS variables), no rendered styles.
- `reset` and `base` are provider-agnostic and have no knowledge of any specific component.
- `objects` is for cross-component layout primitives with no cosmetic opinion (e.g. a flex-stack helper) — reusable *shape*, not reusable *design*.
- `components` is for the shared design-system recipes documented in the `styling-design-system` skill (`.btn`, `.badge`, `.filter-tabs`, …). These are reused **by class name** across many Vue components, so they must live here as global, unscoped CSS — putting one inside a single component's `<style scoped>` block is an ITCSS violation *and* a functional bug: Vue's scoped-attribute rewriting would silently wall that rule off from every other component that also references the class.
- `utils` classes are single-property, high-specificity-by-intent overrides — they are the only layer allowed to use `!important` if truly necessary, and should stay tiny.
- Component/view `<style>` blocks are a layer *above* this triangle (highest specificity, scoped) and are never `@use`d into `main.scss` — Vue's own scoping handles their isolation. `main.scss` only ever aggregates the six shared layers above. The only things that belong in a component's own scoped stylesheet are selectors keyed off that component's own `&-child-name` structure (§1) — a bare recipe class like `.btn` never does.

## 3. Component folders

Each component gets its own dedicated folder under `src/components/` (or `src/views/` for route-level views), named for the component:

```
src/components/DetailPanel/
├── DetailPanel.vue
└── DetailPanel.scss
```

- The folder name matches the component name exactly (PascalCase), same as the file name it contains.
- The stylesheet stays co-located in the same folder and is pulled in via `<style scoped src="./ComponentName.scss" lang="scss"></style>`, or inlined directly in the `.vue` file's `<style scoped lang="scss">` block when it's short — both are acceptable, but always inside the component's own folder, never in the shared `styles/` tree.
- Import the component from elsewhere by its folder path (e.g. `@/components/DetailPanel/DetailPanel.vue`); do not add a folder-level `index.ts` barrel unless a specific consumer already needs one.
- This is a structural convention only — it does not change the selector-naming rule, which still keys off the `.vue` file's own name, not the folder.
