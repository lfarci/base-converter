---
description: 'Rules for src/core, the framework-free source of truth for values and bases'
applyTo: 'src/core/**'
---

# core/ — value math

The single source of truth for how a number is written in a base. Shared principles and
repo-wide layout, types, styling, and accessibility rules live in `src.instructions.md`;
`.ts`-specific modules guidance lives in `typescript.instructions.md`.

## What belongs here

- The digit alphabet, `POSITIONS`, `VALUE_LIMIT`, and the `rows` base definitions.
- Pure helpers that parse, format, compare, or step a value: `parseDigits`,
  `digitsForValue`, `padToPositions`, `digitRange`, `digitValue`, `pickTypedChar`,
  `pageStep`, `positionsForBase`, `bitSpanForDigit`, `bitRangeForDigit`, `bitsPerDigit`,
  `usesBitGrid`, `errorForParsed`.
- Nothing else. If a helper needs a render, a hook, or a DOM node to do its job, it does
  not belong in `core/`.

## Rules

- **No React.** `core/` must not import React, a component, or anything from `digits/`,
  `breakdown/`, or `layout/`. It is a leaf module: features depend on it, never the reverse.
- **No DOM.** Do not touch `document`, `window`, or an existing element. Focus and caret
  decisions belong to `App.tsx`, which already knows the layout.
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
- Every new exported helper gets a spec in `tests/`.

## Checks

Run the checks in `src.instructions.md`.
