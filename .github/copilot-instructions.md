# Basewise — Copilot Instructions

## What this is

"Basewise" is a small React + Vite + Tailwind single-page study tool for positional
notation. It shows one whole number as a fixed sixteen-position grid, with a row per base
(hexadecimal, decimal, octal, binary). You type straight into a row's digit boxes; that row
becomes the source base and every other row rewrites live. It is a static site — no backend,
no API calls, no persistence.

## Stack

- React 19 with function components and hooks only (no class components).
- TypeScript, compiled with `tsc -b` using `tsconfig.app.json`.
- Vite 8 for dev/build, Tailwind CSS 4 via `@tailwindcss/vite` (no `tailwind.config.js`).
- oxlint for linting (`.oxlintrc.json`).
- Playwright for browser interaction tests (`playwright.config.ts`, `tests/`).

For file-scoped standards, see `.github/instructions/src.instructions.md` (shared rules for
`src/`), plus `.github/instructions/react-typescript.instructions.md` (`.tsx`) and
`.github/instructions/typescript.instructions.md` (`.ts`).

## Commands

```sh
npm ci                  # install exactly what package-lock.json pins
npm run dev             # dev server, served under /base-converter/
npm run typecheck       # tsc -b
npm run lint            # oxlint
npm run build           # tsc -b && vite build
npm run test:e2e        # Playwright, Chromium + Firefox
```

`npm run test:e2e` needs browsers installed once with
`npx playwright install chromium firefox`. It starts its own dev server on
`http://127.0.0.1:5198/base-converter/`.

## Architecture

Keep the app split by responsibility — do not let digit parsing or value math creep back
into JSX.

| Path | Responsibility |
| --- | --- |
| `src/core/conversion.ts` | The single source of truth: digit alphabet, `POSITIONS`, `VALUE_LIMIT`, the `rows` base definitions, and pure helpers (`parseDigits`, `digitsForValue`, `padToPositions`, `digitRange`, `digitValue`, `pickTypedChar`, `pageStep`). |
| `src/digits/` | The digit-entry feature: `ConversionTable` (the scrolling table), `DigitRow` (one base's boxes), `DigitBox` (one place), `PlaceValueLabel` (the position label under a box), and `BaseHeaderCell` (the base name, radix, and breakdown toggle). |
| `src/breakdown/` | The place-value breakdown feature: `PlaceValueBreakdown` (the section), `BreakdownTerm` (one non-zero digit's equation), and `BreakdownTotal` (the sum). |
| `src/layout/` | Page furniture shared by the shell: `PageHeader`, `HelpDetails`, and `StatusLine`. |
| `src/App.tsx` | Owns state (`sourceKey`, `sourceDigits`, `hasStartedDigitEntry`, `rejection`), the focus/caret policy, keyboard stepping, and composes the features above. |
| `tests/` | Playwright specs. `tests/helpers.ts` exposes the `digit(page, base, radix, position)` locator — use it instead of writing raw selectors. |

Rules that follow from this:

- All value math, parsing, and formatting lives in `src/core/conversion.ts` and must not
  import React.
- Every component folder is a feature: it owns one part of the page, and imports another
  feature only through that feature's entry component (`digits/ConversionTable`,
  `breakdown/PlaceValueBreakdown`). Do not reach past an entry component into its private
  parts.
- `src/core/` holds no components; `src/layout/` and the feature folders hold no domain
  logic.
- Add or change a base by editing the `rows` array in `src/core/conversion.ts` only.
  Nothing else should hard-code a radix, digit set, or accent colour.
- New pure helpers go in `src/core/conversion.ts` and get a spec in `tests/`. New
  presentational pieces go in the feature folder that owns them, or in `src/layout/` when
  they are page furniture.

## Domain rules that must not regress

- The page is capped at a fixed **16 positions** (`POSITIONS`), so the largest value is
  `VALUE_LIMIT` = `65535`. Binary is the row that needs the most places, so 16 binary
  positions is the cap for every row.
- Going over the cap must show `LIMIT_MESSAGE` and leave the grid intact — never a clipped
  or half-filled answer, and never a wrong number.
- Digits invalid for a row's base are rejected with the inline
  `Enter digits <range> for base <radix>.` message and the prior value is kept.
- Empty input is valid and is distinct from zero. Values render with leading zeros to fill
  all 16 positions; an empty source row renders blank.
- `parseDigits` returns a discriminated result (`empty` / `invalid` / `too-large` / `ok`).
  Branch on `status` rather than re-deriving validity.
- Stepping is on the *value*, not the text: in binary `1011` steps up to `1100`. Page
  Up/Down step by `pageStep(radix)` (10 for radix ≤ 10, otherwise 16).

## Conventions

Every file under `src/` is governed by the instruction sets listed in **Stack** above —
the principles (**KISS**, **DRY**, **YAGNI**), tiny-component, typing, styling, and
accessibility rules all live there and are deliberately not restated here. What follows is
what the instruction sets cannot know about this repository.

- `react/only-export-components` warns by default, so a module exporting a component should
  not also export unrelated values. Put shared values in `core/conversion.ts`.
- Do not rely on colour alone to convey state — the error is always present as words.
- Each row exposes exactly one Tab stop: `tabIndex` is `0` only for the rightmost
  (units) box and `-1` for every other box — do not add 16 Tab stops per row.
- Verify layout at a 390px viewport; the table scrolls horizontally rather than collapsing.

## Workflow

- Keep changes surgical; this repository's `Developer` agent
  (`.github/agents/developer.agent.md`) expects plan → execute → review → PR, and treats
  `npm run typecheck`, `npm run lint`, and `npm run build` as the required checks.
- Add or update a Playwright spec in `tests/` whenever you change digit entry, keyboard
  handling, or the value cap, and run `npm run test:e2e`.
- Update `README.md` when user-visible behaviour, commands, or the file layout change.