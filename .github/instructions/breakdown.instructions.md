---
description: 'Rules for src/breakdown, the place-value breakdown feature'
applyTo: 'src/breakdown/**'
---

# breakdown/ — place-value breakdown

The explanation shown under an expanded row: how each non-zero digit contributes, and how
those contributions add up to the shared decimal total. Shared principles and repo-wide
layout, types, styling, and accessibility rules live in `src.instructions.md`;
`.tsx`-specific component guidance lives in `react-typescript.instructions.md`.

## What belongs here

- `PlaceValueBreakdown.tsx` — the section, its heading, and the terms, and the feature's
  entry component.
- `BreakdownTerm.tsx` — one non-zero digit written as an equation.
- `BreakdownTotal.tsx` — the sum of the terms.

## Rules

- **This feature owns the breakdown's DOM and aria contract**, which the specs bind to:
  - each term *and* the total is `role="math"`; the terms additionally carry
    `data-breakdown-term` and `data-position`, which the total must not.
  - the section is `aria-label={`${base.name} place-value breakdown`}`, and the row toggle
    points at it through `aria-controls`, so `App.tsx` can scope its focus lookup to
    `` document.getElementById(`${base.key}-place-value-breakdown`) ``. Keep that id
    convention in `digits/DigitRow.tsx` and do not rename it here.
  - the heading stays "Breakdown", and a term renders as `base`<sup>`position`</sup> `×`
    `digit` `=` `contribution`, e.g. `160 × 10 (A) = 10`.
- Terms follow the Tab order of the row toggle, so keep `tabIndex={0}` on terms and report
  Tab to the parent through the `onTabFromTerm` callback rather than moving focus yourself.
- **Read-only.** This feature renders an explanation of a value it is given. It never parses,
  formats, converts, or steps anything: contributions come from `../core/conversion`
  (`digitValue`) and the total from the `value` prop.
- Hide a term whose digit is zero, and show the zero case when nothing contributes. A blank
  or unparsed value says so in words rather than rendering an empty sum — never rely on
  colour or an absent term to convey that.
- Hover and focus highlighting is reported upward (`onHoverPosition`, `onFocusPosition`) so
  the matching digit box and position label can highlight with it; do not highlight the
  binary row from inside this folder.
- Reuse the shared visual language: monospace `tabular-nums` for the numbers, `#172b4d`
  text, and the per-base accent from the `base` prop.

## Checks

Run the checks in `src.instructions.md`, and `npm run test:e2e` as well when you change a
term's markup, its `role`, or the Tab handling for a term.
