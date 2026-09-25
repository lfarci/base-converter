---
description: 'Shared coding standards for the src directory: KISS, DRY, YAGNI'
applyTo: 'src/**'
---

# src/ standards

Project-wide rules for everything under `src/`. Language-specific guidance lives in
`react-typescript.instructions.md` (`.tsx`) and `typescript.instructions.md` (`.ts`); each
feature folder has its own file on top of these — `core.instructions.md`,
`digits.instructions.md`, `breakdown.instructions.md`, and `layout.instructions.md`. This
file holds what they share so it is stated once. Adapted from
[Awesome GitHub Copilot](https://awesome-copilot.github.com/).

## Principles

- **KISS**: prefer the direct solution. No abstraction with a single call site, no
  configuration layer, no state that can be derived during render.
- **DRY**: declare each rule, base definition, and design token exactly once, then reuse
  it. Duplicated values or branches are a bug waiting to drift apart.
- **YAGNI**: build only what the current requirement needs. No speculative props, options,
  variants, or "just in case" helpers — delete anything that stops being used.

## Layout

- `src/core/conversion.ts` is the single source of truth: digit alphabet, `POSITIONS`,
  `VALUE_LIMIT`, the `rows` base definitions, and pure helpers. It must not import React.
- Organize `src/` by feature folder: `core/` (pure logic), `digits/`, `breakdown/`, and
  `layout/` (page furniture). A feature imports another feature through that feature's
  entry component only. Each folder's own instruction file states what belongs in it.
- Presentational pieces live in the feature folder that owns them and hold no domain logic.
- Add or change a base by editing the `rows` array only; nothing else hard-codes a radix,
  digit set, or accent colour.
- One module, one responsibility. Pure, framework-free logic belongs in a plain `.ts`
  module so it can be tested without rendering.

## Types

- Strict TypeScript is on (`noUnusedLocals`, `noUnusedParameters`,
  `verbatimModuleSyntax`). Import types with `import type { ... }` or inline `type`
  specifiers, and delete anything you stop using.
- Prefer small local types and unions over optional-everything shapes. Reach for
  discriminated unions when a result has distinct states, then branch on the discriminant
  rather than re-deriving validity.
- Keep types close to the data they describe; export a type only when another module needs
  it.

## Styling and accessibility

- Keep the visual language: white surface, `#172b4d` text, `#2458d3` focus accent,
  per-base accent from `rows`, monospace `tabular-nums` for digits. Reuse those values
  instead of inventing near duplicates (DRY).
- Tailwind is configured CSS-first: no `tailwind.config.js` and no PostCSS config for
  Tailwind. The `@tailwindcss/vite` plugin plus `@import "tailwindcss";` is the whole setup.
- Only reach for `style={...}` for genuinely dynamic values (for example a per-base accent
  colour); static appearance belongs in classes.
- Keep semantic HTML — tables, lists, `button`, `input`. Utilities style; they do not
  excuse a `div` where an element has meaning.
- Do not rely on colour alone to convey state; state is also always present as words. The
  status line is a single live region: `role="alert"` for errors, otherwise `role="status"`.
- Maintain a sane tab order: `tabIndex={0}` only on the control that should receive focus,
  `-1` for the rest. Keep the global `:focus-visible` outline visible.
- Digit boxes carry `aria-label` including base, radix, and position, and mark themselves
  read-only rather than disabled (`readOnly`, plus `data-editable` only when editable).
  Keep these when editing `digits/DigitBox`.
- The table keeps a 768px minimum width and scrolls horizontally on narrow screens, with
  the base column `sticky left-0`. Verify layout at a 390px viewport.

## Conventions

- Two-space indent, no semicolons, single quotes.

## Checks

Run these before calling a change done:

```sh
npm run typecheck
npm run lint
npm run build
```
