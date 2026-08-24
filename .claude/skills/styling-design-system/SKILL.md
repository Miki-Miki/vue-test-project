---
description: Design tokens, colors, spacing, typography, dark theme, and component recipes (badges, buttons, filter tabs, checkboxes, AG Grid theming) for this project's UI. Use whenever writing or editing a component's visual styles, choosing a color/spacing/radius value, building a new UI element, or theming AG Grid — not for file/folder or selector-naming questions (see .claude/rules/styling-structure.md for those, which is always loaded).
---

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
| -------------- | ---------------------------------------------------- |
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

All theme-sensitive tokens (surfaces, borders, text, status colors, AG Grid overrides) are already declared for both themes in `src/assets/styles/_variables.scss`. Never hardcode light or dark color values in components — always use `var(--color-*)` tokens so switching is automatic.

## Color System

All colors must reference CSS custom properties defined in `src/assets/styles/_variables.scss` (the Settings layer — see [.claude/rules/styling-structure.md](../../rules/styling-structure.md) for the full ITCSS layout).

### Accent Color

The accent color is `#4F46E5` (indigo). It is stored as `--accent` in `_variables.scss`.
Use it for: active states, selected rows, focus rings, primary buttons, links, interactive badges.

### Semantic Status Colors

These are used for status badges (e.g. payment status, fulfillment status):

| Status         | Background            | Text                    |
| -------------- | ---------------------- | ------------------------ |
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

### Tables / Grids (AG Grid)

Use AG Grid's Theming API (`themeQuartz` or `themeBalham` as the base). Override via CSS custom properties on `.ag-theme-*` or globally.

**Required overrides in SCSS:**

```scss
// In a component's scoped style block (see the per-component-folder convention
// in .claude/rules/styling-structure.md) or src/assets/styles/_objects.scss for a global override
:root {
  --ag-spacing: 6px;
  --ag-border-radius: 2px;
  --ag-row-height: 36px;
  --ag-header-height: 36px;
  --ag-font-size: 13px;
  --ag-font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --ag-background-color: var(--color-surface);
  --ag-foreground-color: var(--color-text);
  --ag-border-color: var(--color-border);
  --ag-header-background-color: var(--color-surface-muted);
  --ag-row-hover-color: var(--color-surface-hover);
  --ag-selected-row-background-color: var(--accent-subtle);
  --ag-accent-color: var(--accent);
  --ag-cell-horizontal-padding: 10px;
  --ag-card-shadow: none;
  --ag-popup-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  --ag-row-border: true;
  --ag-column-border: false;
  --ag-header-column-separator-display: block;
  --ag-header-column-separator-color: var(--color-border);
}
```

**Using the Theming API (in `<script setup>`):**

```ts
import { themeQuartz } from 'ag-grid-community'

const gridTheme = themeQuartz.withParams({
  spacing: 6,
  borderRadius: 2,
  rowHeight: 36,
  headerHeight: 36,
  fontSize: 13,
  accentColor: '#4F46E5',
  backgroundColor: '#ffffff',
  foregroundColor: '#111827',
  borderColor: '#e5e7eb',
  headerBackgroundColor: '#f9fafb',
  rowHoverColor: '#f3f4f6',
  selectedRowBackgroundColor: '#ede9fe',
  cardShadow: false,
  columnBorder: false,
  rowBorder: true,
})
```

**AG Grid class overrides** (target `.ag-` class names for fine-grained control):

```scss
.ag-header-cell-text {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
}

.ag-cell {
  display: flex;
  align-items: center;
}

.ag-checkbox-input-wrapper {
  border-radius: 2px;
}
```

**Safe to change:** margins, paddings, sizes, colors, fonts, borders.
**Do NOT change:** `position`, `overflow`, `pointer-events`, `display` on major layout containers.

### Status Badges

```vue
<span class="badge badge--paid">Paid</span>
<span class="badge badge--warning">Partially paid</span>
```

`.badge` is a shared design-system recipe, not a single component's structural markup, so it's exempt from the `&-child-name` component standard in [.claude/rules/styling-structure.md](../../rules/styling-structure.md) — but it still lives in SCSS and still nests its own modifiers with `&`:

```scss
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

  &--paid,
  &--neutral {
    background-color: var(--status-neutral-bg);
    color: var(--status-neutral-text);
  }

  &--warning {
    background-color: var(--status-warning-bg);
    color: var(--status-warning-text);
  }

  &--info {
    background-color: var(--status-info-bg);
    color: var(--status-info-text);
  }
}
```

### Filter Tabs / Segmented Controls

Flat pill-style tab bar at the top of data views. No borders, highlight active tab with background.

```scss
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

  &--active {
    background: var(--color-surface);
    color: var(--color-text);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  }
}
```

### Buttons

```scss
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

  &:hover {
    background: var(--color-surface-muted);
  }

  &--primary {
    background: var(--accent);
    border-color: var(--accent);
    color: #ffffff;

    &:hover {
      background: var(--accent-dark);
      border-color: var(--accent-dark);
    }
  }
}
```

### Checkboxes

Use native checkboxes styled with SCSS. No custom components unless necessary.

```scss
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

  &:checked {
    background: var(--accent);
    border-color: var(--accent);
  }
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
- Do not use inline styles — always use CSS classes referencing design tokens from `src/assets/styles/_variables.scss`
