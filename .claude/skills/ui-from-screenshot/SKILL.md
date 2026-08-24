---
description: Convert a user-submitted UI screenshot or mockup into Vue 3 components that match this project's design system. Use when the user shares a screenshot/image and asks to build, clone, replicate, or match a UI from it.
---

## Instructions

1. Read the `styling-design-system` skill for the project's design tokens, spacing scale, and component recipes (badges, buttons, filter tabs, AG Grid theming) — every new UI element must reuse these rather than introducing new values. Also check [src/CLAUDE.md](../../../src/CLAUDE.md) / [.claude/rules/styling-structure.md](../../rules/styling-structure.md) for the selector-naming and component-folder conventions any new files must follow.
2. Read the submitted image with the Read tool and identify: layout structure (grid/flex), component types present (table, badges, tabs, buttons, forms), and approximate spacing/color relationships.
3. Search `src/components/` and `src/views/` for existing components that already cover part of the screenshot before writing anything new.
4. For anything beyond a small, self-contained edit, delegate to the `ui-designer` agent (`.claude/agents/ui-designer.md`) so the implementation work runs with a focused context.
5. If the screenshot implies a token, spacing value, color, or radius that isn't defined in the `styling-design-system` skill, do not invent one — ask the user or flag the gap explicitly.

## Supporting files

`reference/` is reserved for deeper material as it accumulates — e.g. a catalog of screenshot-to-component mappings, edge cases in translating specific UI patterns (dense tables, multi-state badges) to this project's tokens. Add files there instead of growing this SKILL.md indefinitely; keep this file as the short, always-loaded entry point and put exhaustive reference material in `reference/*.md`, linked from here.
