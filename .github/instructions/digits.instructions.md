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
  - `data-digit` and `data-position` on every digit box; `data-editable` passes
      `editable || undefined` and `data-highlighted` passes `highlighted || undefined` —
      never `false`: React would serialize that to `data-editable="false"`, and `App.tsx`
      branches on `hasAttribute('data-editable')`, so a read-only readout would start
      counting as a deliberate click target.
  - the `aria-label` template `` `${base.name} (base ${base.radix}) digit at position ${position}${bitRange ? `, ${bitRange}` : ''}` ``.
  - `tabIndex={0}` on the units box only; `-1` everywhere else. That is one *digit-box* Tab
    stop per row: the row toggle in `BaseHeaderCell` is the row's second stop, and the chain
    is units → row toggle → any open breakdown terms → next row's units.
  - the breakdown id convention `` `${base.key}-place-value-breakdown` ``, declared in
    `DigitRow.tsx` and consumed by `App.tsx` and the specs. `breakdown/` renders into it and
    must not rename it.
  - the `.place-value-label` structure (a wrapper with one or two spans), its per-base
    colours, and its `data-position` / `data-highlighted` attributes.
  - the 144px width of the Base column and the `role="region"` /
    `aria-label="Scrollable base conversion table"` scroll wrapper.
    - the toggle in `BaseHeaderCell` keeps `aria-expanded={isBreakdownOpen}` with
      `aria-controls={breakdownId}`, and the exact
      `` `Click to ${isBreakdownOpen ? 'close' : 'open'} the ${base.name.toLowerCase()} place-value breakdown` ``
      `title` the specs assert.
  - `data-source={isSource || undefined}` on the row's `th[scope="row"]` â€” set on exactly
    the source row and omitted everywhere else, never serialized as `false`. `isSource`
    comes from `displayedRows` in `core/display.ts` and travels `ConversionTable` â†’
    `DigitRow` â†’ `BaseHeaderCell` as an explicit prop; the source rule is never
    re-derived in a component. The visible cue is a 3px `aria-hidden` ink bar absolutely
    positioned at the cell's left edge, which adds no layout impact; if it ever disturbs a
    measured contract, the attribute and the status line's wording carry the state alone.
- **Import another feature through its entry component.** `digits/` may use
  `../breakdown/PlaceValueBreakdown`; it must not reach into `BreakdownTerm`,
  `BreakdownTotal`, or any other private part of that folder.
- **Presentational only.** A component here receives data and callbacks via props and holds
  no domain logic. Any parse, format, or step goes through `../core/conversion`, and any
  entry or caret decision goes through `../core/entry` and `../core/focus`.
- Never hard-code a radix, digit set, or accent colour. Read them from the `base` prop,
  which comes from the `rows` array in `core/`.
- Per-row UI state (which breakdown is open, which place is hovered or focused) is local to
  the row. Value state and the caret policy live in `core/`: `App.tsx` holds the state and
  hands it to `core/entry.ts`, which decides the next state and the focus target.
- `DigitBox` is the one place that owns a box's attributes, `inputMode`, `readOnly`, and
  colour-mix styles. Do not restate those in `DigitRow`.

## Checks

Run the checks in `src.instructions.md`, and `npm run test:e2e` as well: this folder owns
the DOM the specs assert, so a change here is only done when the suite is green.
