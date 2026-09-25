---
description: 'Rules for src/digits, the digit-entry feature (table, rows, boxes, labels)'
applyTo: 'src/digits/**'
---

# digits/ — digit entry

The feature a user actually types into: the scrolling table, one row per base, one box per
place, and the base header. Shared principles and repo-wide layout, types, styling, and
accessibility rules live in `src.instructions.md`; `.tsx`-specific component guidance lives
in `react-typescript.instructions.md`.

## What belongs here

- `ConversionTable.tsx` — the scroll region and the table, the feature's entry component.
- `DigitRow.tsx` — one base's `<tr>`, its grid, and its per-row highlight state.
- `DigitBox.tsx` — one digit `<input>`.
- `PlaceValueLabel.tsx` — the position (and bit range) label under a box.
- `BaseHeaderCell.tsx` — the base name, radix, and the breakdown toggle.

## Rules

- **This feature owns the DOM contract.** The Playwright specs bind to it, so a change here
  is a change to a public interface. Keep, exactly:
  - `data-digit`, `data-editable`, `data-position`, `data-highlighted` on every digit box.
  - the `aria-label` template `` `${base.name} (base ${base.radix}) digit at position ${position}${bitRange ? `, ${bitRange}` : ''}` ``.
  - `tabIndex={0}` on the units box only; `-1` everywhere else. A row exposes exactly one
    Tab stop, and the chain is units → row toggle → next row's units.
  - the `.place-value-label` structure (a wrapper with one or two spans) and its per-base
    colours, the 144px width of the Base column, and the
    `role="region"` / `aria-label="Scrollable base conversion table"` scroll wrapper.
- **Import another feature through its entry component.** `digits/` may use
  `../breakdown/PlaceValueBreakdown`; it must not reach into `BreakdownTerm`,
  `BreakdownTotal`, or any other private part of that folder.
- **Presentational only.** A component here receives data and callbacks via props and holds
  no domain logic. Any parse, format, or step goes through `../core/conversion`.
- Never hard-code a radix, digit set, or accent colour. Read them from the `base` prop,
  which comes from the `rows` array in `core/`.
- Per-row UI state (which breakdown is open, which place is hovered or focused) is local to
  the row. Value state and focus policy stay in `App.tsx`.
- `DigitBox` is the one place that owns a box's attributes, `inputMode`, `readOnly`, and
  colour-mix styles. Do not restate those in `DigitRow`.
- The table scrolls horizontally rather than collapsing. Verify at a 390px viewport.

## Checks

Run the checks in `src.instructions.md`, and `npm run test:e2e` as well: this folder owns
the DOM the specs assert, so a change here is only done when the suite is green.
