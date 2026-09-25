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
- Vitest for unit tests of the pure `src/core/` modules (`*.test.ts` beside the module).

For file-scoped standards, see `.github/instructions/src.instructions.md` (shared rules for
`src/`), plus `.github/instructions/react-typescript.instructions.md` (`.tsx`) and
`.github/instructions/typescript.instructions.md` (`.ts`). Each feature folder adds its own
rules: `core.instructions.md` (value math, entry, display, and focus), `digits.instructions.md`
(digit entry), `breakdown.instructions.md` (place-value breakdown), and
`layout.instructions.md` (page furniture and the app shell).

## Commands

```sh
npm ci                  # install exactly what package-lock.json pins
npm run dev             # dev server, served under /base-converter/
npm run typecheck       # tsc -b
npm run lint            # oxlint
npm run build           # tsc -b && vite build
npm run test:unit       # Vitest, the pure src/core rules
npm run test:e2e        # Playwright, Chromium + Firefox
```

`npm run test:e2e` needs browsers installed once with
`npx playwright install chromium firefox`. It starts its own dev server on
`http://127.0.0.1:5198/base-converter/`.

Pull requests run the unit suite and the browser suite together in the
`check-playwright-test.yml` workflow.

## Architecture

Keep the app split by responsibility — do not let digit parsing or value math creep back
into JSX.

| Path | Responsibility |
| --- | --- |
| `src/core/conversion.ts` | The single source of truth: digit alphabet, `POSITIONS`, `VALUE_LIMIT`, the `rows` base definitions, and the value math (`parseDigits`, `digitsForValue`, `padToPositions`, `digitRange`, `digitValue`, `pickTypedChar`, `pageStep`). |
| `src/core/entry.ts` | The entry state machine: `EntryState`, `keyActionFor` (what a keystroke means), and the `entryFor*` functions that return the next state plus the focus target. |
| `src/core/display.ts` | The derived page data: the source base, the status line, and the boxes each row shows. |
| `src/core/focus.ts` | Where Tab goes next, as a `FocusTarget` the shell resolves to a node. No DOM. |
| `src/digits/` | The digit-entry feature: `ConversionTable` (the scrolling table), `DigitRow` (one base's boxes), `DigitBox` (one place), `PlaceValueLabel` (the position label under a box), and `BaseHeaderCell` (the base name, radix, and breakdown toggle). |
| `src/breakdown/` | The place-value breakdown feature: `PlaceValueBreakdown` (the section), `BreakdownTerm` (one non-zero digit's equation), and `BreakdownTotal` (the sum). |
| `src/layout/` | Page furniture shared by the shell: `PageHeader`, `HelpDetails`, and `StatusLine`. |
| `src/App.tsx` | Page structure and wiring: it holds the entry state, composes the features above, and resolves a focus target to a real node. It states no rules of its own. |
| `tests/` | Playwright specs. `tests/helpers.ts` exposes the `digit(page, base, radix, position)` locator — use it instead of writing raw selectors. |

Rules that follow from this:

- All shared parsing, value math, and entry decisions live in `src/core/` and must not
  import React. The one exception is `breakdown/`, which owns the contribution arithmetic
  and the `toString()` calls that render it.
- Every component folder is a feature: it owns one part of the page, and imports another
  feature only through that feature's entry component (`digits/ConversionTable`,
  `breakdown/PlaceValueBreakdown`). Do not reach past an entry component into its private
  parts.
- `src/core/` holds no components and touches no DOM; `src/layout/` and the feature folders
  hold no domain logic.
- Add or change a base by editing the `rows` array in `src/core/conversion.ts` only.
  Nothing else should hard-code a radix, digit set, or accent colour.
- New pure helpers go in the `src/core/` module that owns the rule and get a unit spec
  beside them in `src/core/*.test.ts`. New presentational pieces go in the feature folder
  that owns them, or in `src/layout/` when they are page furniture.
- `src/App.tsx` stays page structure. If a change adds a rule about what a keystroke means,
  which boxes a row shows, or where the caret goes next, that rule belongs in `core/`.

## Domain rules that must not regress

- The page is capped at a fixed **16 positions** (`POSITIONS`), so the largest value is
  `VALUE_LIMIT` = `65535`. Binary is the row that needs the most places, so 16 binary
  positions is the cap for every row.
- Going over the cap must show `LIMIT_MESSAGE` and leave the grid intact — never a clipped
  or half-filled answer, and never a wrong number.
- Digits invalid for a row's base are rejected with the inline
  `Enter digits <range> for base <radix>.` message and the prior value is kept.
- Empty input is valid and is distinct from zero. Values render with leading zeros to fill
  every available place — five decimal, sixteen binary, six octal, four hexadecimal
  (`positionsForBase`) — not a fixed sixteen per row; an empty source row renders blank.
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
  not also export unrelated values. Put shared values in `core/`.
- Do not rely on colour alone to convey state — the error is always present as words.
- Each row exposes one *digit-box* Tab stop: `tabIndex` is `0` for the rightmost
  (units) box and `-1` for every other box — the row's header toggle is its second Tab
  stop. Do not add 16 Tab stops per row.
- Verify layout at a 390px viewport; the table scrolls horizontally rather than collapsing.

## Workflow

- Keep changes surgical; this repository's `Developer` agent
  (`.github/agents/developer.agent.md`) expects plan → execute → review → PR, and treats
  `npm run typecheck`, `npm run lint`, and `npm run build` as the required checks.
- Add or update a Playwright spec in `tests/` whenever you change digit entry, keyboard
  handling, or the value cap, and run `npm run test:e2e`. A rule that lives in `src/core/`
  is pinned by a unit spec there instead, with `npm run test:unit`.
- Update `README.md` when user-visible behaviour, commands, or the file layout change.