# Styling Instructions

Styling standards live in two places, split by how often they're needed:

- **[.claude/rules/styling-structure.md](../.claude/rules/styling-structure.md)** — always in effect for any `<style>` block or stylesheet: the `&-child-name` selector-naming standard, the ITCSS layer order for `src/assets/styles/`, and the per-component-folder convention. Read it before writing or editing any component's styles or the shared styles tree.
- **`styling-design-system` skill** — design tokens, colors, spacing, typography, dark theme, and component recipes (badges, buttons, filter tabs, checkboxes, AG Grid theming). Invoke it (or let it auto-load) whenever a change involves an actual visual/design decision — picking a color, spacing value, radius, or building/theming a UI element. Skip it for changes that are purely structural (e.g. renaming a selector) with no new visual decisions.
