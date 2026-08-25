---
applyTo: 'src/**/*.vue,src/**/*.css,src/**/*.ts'
---

# Styling Instructions

## Design Philosophy

Tight, functional, data-dense UI. Every element should feel purposeful with minimal decoration. No visual noise.

- **Padding**: Use small, consistent spacing. Base unit is `4px`. Components use multiples: `4px`, `8px`, `12px`, `16px`. Never exceed `24px` padding for inner content.
- **Border radius**: `2px` maximum. Prefer `0` or `2px`. Exception: status/badge pills may use `4px`.
- **Shadows**: None. Use borders and background color differences to separate surfaces.
- **Borders**: Single `1px` lines using `var(--color-border)`. Never double borders.
- **Transitions**: Minimal. Only for interactive states (hover, focus). Max `150ms`.

## Dark Theme

The project supports three theme states, controlled by an attribute on `<html>`:

| State          | How to activate                                     |
| -------------- | --------------------------------------------------- |
| Light (forced) | `<html data-theme="light">`                         |
| Dark (forced)  | `<html data-theme="dark">` or `<html class="dark">` |
| System default | No attribute — follows `prefers-color-scheme`       |

**Toggle implementation** (in a composable or store):

```ts
function toggleTheme() {
  const html = document.documentElement
  const isDark = html.getAttribute('data-theme') === 'dark'
  html.setAttribute('data-theme', isDark ? 'light' : 'dark')
}
```

All theme-sensitive tokens (surfaces, borders, text, status colors) are already declared for both themes in `variables.css`. Never hardcode light or dark color values in components — always use `var(--color-*)` tokens so switching is automatic.

## Color System

All colors must reference CSS custom properties defined in `src/assets/variables.css`.

### Accent Color

The accent color is `#4F46E5` (indigo). It is stored as `--accent` in `variables.css`.
Use it for: active states, selected rows, focus rings, primary buttons, links, interactive badges.

### Semantic Status Colors

These are used for status badges (e.g. payment status, fulfillment status):

| Status         | Background            | Text                    |
| -------------- | --------------------- | ----------------------- |
| Paid           | `--status-neutral-bg` | `--status-neutral-text` |
| Partially paid | `--status-warning-bg` | `--status-warning-text` |
| Unfulfilled    | `--status-warning-bg` | `--status-warning-text` |
| Fulfilled      | `--status-neutral-bg` | `--status-neutral-text` |
| Ready for      | `--status-info-bg`    | `--status-info-text`    |

### Neutrals

- Background: `var(--color-surface)` (white / near-white)
- Subtle surface: `var(--color-surface-muted)` (off-white)
- Border: `var(--color-border)`
- Primary text: `var(--color-text)`
- Secondary text: `var(--color-text-muted)`

## Typography

- Font: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Base size: `13px` for table/grid data, `14px` for body text
- Line height: `1.4` for compact data views
- Headers/labels: `font-weight: 500`, no uppercase unless used for column headers
- Column headers: `font-weight: 600`, `font-size: 12px`, `text-transform: uppercase`, `letter-spacing: 0.04em`

## Components

### Tables (Vuetify `v-data-table`)

Use Vuetify's `<v-data-table>` with `density="compact"` for tight, data-dense rows. Vuetify has no built-in awareness of this project's `--color-*` tokens, so override it via `:deep()` selectors inside the consuming component's own scoped stylesheet — never in the shared global styles, since the table is specific to one component/view.

**Required overrides**, scoped inside the component's own wrapper selector:

```css
.grid-view-wrapper :deep(.v-data-table) {
  background: var(--color-surface);
  color: var(--color-text);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
}

.grid-view-wrapper :deep(.v-data-table__th) {
  background: var(--color-surface-muted);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
}

.grid-view-wrapper :deep(tbody tr) {
  cursor: pointer;
}

.grid-view-wrapper :deep(tbody tr:hover) {
  background: var(--color-surface-hover);
}

.grid-view-wrapper :deep(.v-data-table__td),
.grid-view-wrapper :deep(.v-data-table__th) {
  border-color: var(--color-border) !important;
}
```

**Row clicks:** `v-data-table` has no `click:row` event — wire row interactivity through the `row-props` prop, a function receiving `{ item, index, internalItem }` and returning props (typically `{ onClick: () => ... }`) to spread onto that row's `<tr>`.

**Cell formatting:** use named item slots (bracket syntax, e.g. `#[\`item.genre\`]="{ value }"`, since the slot name contains a dot) for anything beyond a raw field value — e.g. joining an array field into a comma-separated string.

**Safe to change:** margins, paddings, sizes, colors, fonts, borders via `:deep()`.
**Do NOT change:** `position`, `overflow`, `pointer-events`, `display` on Vuetify's internal layout wrappers.

### Status Badges

```vue
<span class="badge badge--paid">Paid</span>
<span class="badge badge--warning">Partially paid</span>
```

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
  white-space: nowrap;
}

.badge--paid,
.badge--neutral {
  background-color: var(--status-neutral-bg);
  color: var(--status-neutral-text);
}

.badge--warning {
  background-color: var(--status-warning-bg);
  color: var(--status-warning-text);
}

.badge--info {
  background-color: var(--status-info-bg);
  color: var(--status-info-text);
}
```

### Filter Tabs / Segmented Controls

Flat pill-style tab bar at the top of data views. No borders, highlight active tab with background.

```css
.filter-tabs {
  display: flex;
  gap: 2px;
  padding: 4px;
  background: var(--color-surface-muted);
  border-radius: 6px;
  border: 1px solid var(--color-border);
}

.filter-tab {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  border: none;
  background: transparent;
  transition:
    background 150ms,
    color 150ms;
}

.filter-tab--active {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}
```

### Buttons

```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 2px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  transition: background 150ms;
}

.btn:hover {
  background: var(--color-surface-muted);
}

.btn--primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #ffffff;
}

.btn--primary:hover {
  background: var(--accent-dark);
  border-color: var(--accent-dark);
}
```

### Checkboxes

Use native checkboxes styled with CSS. No custom components unless necessary.

```css
input[type='checkbox'] {
  appearance: none;
  width: 14px;
  height: 14px;
  border: 1px solid var(--color-border);
  border-radius: 2px;
  background: var(--color-surface);
  cursor: pointer;
  transition:
    background 100ms,
    border-color 100ms;
}

input[type='checkbox']:checked {
  background: var(--accent);
  border-color: var(--accent);
}
```

## Layout

- Page padding: `16px 20px`
- Section gap: `16px`
- No `max-width` containers unless explicitly required
- Use CSS Grid or Flexbox. Prefer Grid for two-dimensional layouts, Flex for one-dimensional

## Do Nots

- No `box-shadow` except subtle overlays (`0 2px 8px rgba(0,0,0,0.10)`) for dropdowns/popups
- No `border-radius` above `6px` (only pill badges and modals may use more)
- No gradient backgrounds
- No decorative dividers (rely on background color change or a single `1px` border)
- No animations beyond `150ms` hover/focus transitions
- Do not use inline styles — always use CSS classes referencing design tokens from `variables.css`
