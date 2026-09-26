import { positionsForBase, POSITIONS, rows, type Base } from './conversion'

// Where the caret should go next. This module only decides; App.tsx turns a target into a
// real node, so the policy stays testable without a browser.
export type FocusTarget =
  | { kind: 'cell'; cellKey: string }
  | { kind: 'toggle'; baseKey: string }
  | { kind: 'breakdown-term'; breakdownId: string }
  | { kind: 'footer-link' }

// Digit boxes register themselves as `${base.key}:${index}`, counted from the most
// significant place, so a row's units box is its last cell.
export function unitsCellKey(base: Base, positions = POSITIONS) {
  return `${base.key}:${positionsForBase(base.radix, positions) - 1}`
}

// The container a row's breakdown renders into, and the id its toggle points aria-controls
// at.
export function breakdownIdFor(base: Base) {
  return `${base.key}-place-value-breakdown`
}

// Tab walks down the page: a row's units box, then its toggle, then any open breakdown
// terms, then the next row's units box. Forward navigation continues to the footer after
// the last row.
function rowControlTarget(base: Base, direction: -1 | 1, positions: number): FocusTarget | null {
  const index = rows.findIndex((row) => row.key === base.key)
  const targetRow = rows[index + direction]
  if (!targetRow) return direction === 1 ? { kind: 'footer-link' } : null

  return direction === 1
    ? { kind: 'cell', cellKey: unitsCellKey(targetRow, positions) }
    : { kind: 'toggle', baseKey: targetRow.key }
}

export function tabFromUnits(base: Base, shiftKey: boolean, positions = POSITIONS): FocusTarget | null {
  if (shiftKey) return rowControlTarget(base, -1, positions)
  return { kind: 'toggle', baseKey: base.key }
}

export function tabFromToggle(base: Base, shiftKey: boolean, hasBreakdownTerm: boolean, positions = POSITIONS): FocusTarget | null {
  if (shiftKey) return { kind: 'cell', cellKey: unitsCellKey(base, positions) }
  if (hasBreakdownTerm) return { kind: 'breakdown-term', breakdownId: breakdownIdFor(base) }
  return rowControlTarget(base, 1, positions)
}

export function tabFromBreakdownTerm(base: Base, shiftKey: boolean, isFirst: boolean, isLast: boolean, positions = POSITIONS): FocusTarget | null {
  if (shiftKey && isFirst) return { kind: 'toggle', baseKey: base.key }
  if (!shiftKey && isLast) return rowControlTarget(base, 1, positions)
  return null
}
