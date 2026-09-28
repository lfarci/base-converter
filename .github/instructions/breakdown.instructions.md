---
description: 'Rules for src/breakdown, the place-value breakdown feature'
applyTo: 'src/breakdown/**'
---

# breakdown/ — place-value breakdown

The explanation shown under each base row: a compact contribution sum when collapsed, and
how each non-zero digit contributes when expanded. Shared principles and repo-wide
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
  - the "Breakdown" heading stays visible in every visible state, expanded or collapsed.
    A term renders as `base`<sup>`position`</sup> `×` `digit` `=` `contribution`, e.g.
    `160 × 10 (A) = 10`.
  - the collapsed preview for a non-zero value is a non-focusable `role="math"` equation
    showing each non-zero digit multiplied by its radix power and the resulting addends
    summed to the total (e.g. `10¹ × 1 + 10⁰ × 7 = 17`), left-aligned with the digit grid.
    Keep each individual place equation together when it wraps. A zero or blank value shows
    the prompt "Breakdown for the value will be shown here when a value is entered."
- Terms follow the Tab order of the row toggle, so keep `tabIndex={0}` on terms and report
  Tab to the parent through the `onTabFromTerm` callback rather than moving focus yourself.
- **Read-only.** This feature explains a value it is given: it never parses digits or steps
  the value. It does own the arithmetic and formatting that the explanation needs — the
  contribution (`BigInt(amount) * BigInt(base.radix) ** BigInt(position)`, all three
  operands converted) and the `toString()` calls that write those `bigint`s as text are
  local to this folder. `digitValue` supplies only the digit's small numeric value.
- Hide a term whose digit is zero, and show the zero case when nothing contributes. A blank
  or unparsed value says so in words rather than rendering an empty sum — never rely on
  colour or an absent term to convey that.
- Hover and focus highlighting is reported upward (`onHoverPosition`, `onFocusPosition`) so
  the matching digit box and position label can highlight with it; do not highlight the
  binary row from inside this folder.
- Reuse the shared visual language: `.mono-tech` for the numbers, `--color-ink` text on
  the underlying table surface, and a transparent background with a `--color-frame` left
  rule. Use the per-base accent from the `base` prop for decoration and tint only. Any
  texture must stay in the empty leading gutter, with `aria-hidden` and no overlap with
  content; preserve the clear surface. A highlighted term uses a subtle accent tint and a
  55/45 accent-ink border, matching the place-value label, plus `text-decoration: underline`
  as its shape cue, so the state never rests on hue. **Align the panel's content edge with
  the digit grid:** the table's Base column is 144px wide and `DigitRow`'s digit cell adds
  12px of left padding, so content starts 156px from the table edge. The panel has a 2px
  left border, so its leading padding is 154px. If either measurement changes, rebalance the
  offset and re-verify alignment.

## Checks

Run the checks in `src.instructions.md`, and `npm run test:e2e` as well when you change a
term's markup, its `role`, or the Tab handling for a term.
