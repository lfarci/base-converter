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

- `src/core/` is the single source of truth: digit alphabet, `POSITIONS`, `VALUE_LIMIT`,
  the `rows` base definitions, and the pure helpers. `conversion.ts` is the value math;
  `entry.ts` is the entry state machine; `display.ts` derives what the page shows;
  `focus.ts` decides where Tab goes. `core/` must not import React or touch the DOM.
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

- Keep the visual language: a warm printed worksheet. Paper surfaces (`--color-paper`,
  `--color-paper-2`, `--color-paper-3`), `--color-ink` text, `--color-ink-soft` secondary
  text, `--color-rule`/`--color-rule-soft` rules, `--color-focus` for the focus ring,
  `--color-danger` for errors, the per-base accent from `rows`, serif display type for
  prose and base names, and monospace `tabular-nums` for digits, positions, and equations.
  Reuse those values instead of inventing near duplicates (DRY). Every colour lives in the
  `@theme` block in `index.css`; do not write ad-hoc hex values in components.
- Faint values are for decorative rules only. Every text pair is normal size and must clear
  4.5:1 against its surface; boundaries, focus rings, and the source-row margin bar must
  clear 3:1. Per-base accents are decoration and tint, never the sole boundary or state cue.
- Maintain a non-colour cue for every state: underlines on highlighted labels and breakdown
  terms, rings on highlighted boxes, and the solid margin bar on the source row. Those
  shapes are what survive `forced-colors`.
- `index.css` also carries the `prefers-reduced-motion`, `prefers-contrast: more`, and
  `forced-colors: active` blocks. Keep them unlayered so they beat Tailwind utilities and
  any accent colour a component computes inline; update them when you add a state cue.
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

Run `npm run test:unit` when the change touches `src/core/`, and `npm run test:e2e` when it
touches digit entry, keyboard handling, or the DOM.
