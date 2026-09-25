---
description: 'Rules for src/core, the framework-free source of truth for values and bases'
applyTo: 'src/core/**'
---

# core/ — the rules, in plain TypeScript

The single source of truth for how a number is written in a base. Shared principles and
repo-wide layout, types, styling, and accessibility rules live in `src.instructions.md`;
`.ts`-specific modules guidance lives in `typescript.instructions.md`.

## What belongs here

- The digit alphabet, `POSITIONS`, `VALUE_LIMIT`, `LIMIT_MESSAGE`, and the `rows` base
  definitions.
- Pure helpers that parse, format, compare, or step a value: `parseDigits`,
  `digitsForValue`, `padToPositions`, `digitRange`, `digitValue`, `pickTypedChar`,
  `pageStep`, `positionsForBase`, `bitSpanForDigit`, `bitRangeForDigit`, `bitsPerDigit`,
  `usesBitGrid`, `errorForParsed`.
- The entry state machine (`entry.ts`): `initialEntryState`, `keyActionFor`, and the
  `entryFor*` functions that turn a digit, a deletion, or a step into the next state.
- Derived page data (`display.ts`): which row is the source, what the status line says, and
  which boxes each row shows.
- Focus and Tab decisions (`focus.ts`): the `FocusTarget` a Tab or Shift+Tab should land on.
- Nothing else. If a helper needs a render or a hook to do its job, it does not belong in
  `core/`.

`App.tsx` should contain the page structure and the wiring that turns a `FocusTarget` into
a real node — no rules about what a keystroke means, which boxes a row shows, or where the
caret goes next.

## Rules

- **No React.** `core/` must not import React, a component, or anything from `digits/`,
  `breakdown/`, or `layout/`. It is a leaf module: features depend on it, never the reverse.
- **No DOM.** Do not touch `document` or `window`. `focus.ts` decides *where* the caret
  should go and returns a `FocusTarget`; `App.tsx` is the only module that resolves one to
  an element.
- One definition per rule. `bitsPerDigit` exists so no other module re-derives
  `Math.log2(radix)`; `usesBitGrid` exists so no component repeats the "radix 8 and 16 are
  whole bit groups" test. Add a helper here rather than a second copy out there (DRY).
- Add or change a base by editing the `rows` array only. Nothing outside `core/` may
  hard-code a radix, digit set, or accent colour.
- Keep parsing a discriminated result (`empty` / `invalid` / `too-large` / `ok`) and let
  callers branch on `status`. Never re-derive validity from the digits at a call site.
- Return a `bigint` for values and `readonly` data for tables. Never return `null` to mean
  "invalid" when the caller also needs to tell that apart from "empty".
- Functions are small, total, and side-effect free at import time. No mutable module-level
  state, no caching layer, no configuration object (YAGNI).
- Every new exported helper gets a unit spec beside it (`*.test.ts` in this folder). A
  helper that also drives the page gets Playwright coverage too, but the unit spec is what
  pins its rules.

## Checks

Run the checks in `src.instructions.md`, and `npm run test:unit` as well: this folder is
where the value rules and the entry state machine live, so a change here is only done when
the unit suite is green.
