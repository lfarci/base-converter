import { describe, expect, it } from 'vitest'
import { rows } from './conversion'
import {
  breakdownIdFor,
  tabFromBreakdownTerm,
  tabFromToggle,
  tabFromUnits,
  unitsCellKey,
} from './focus'

const decimal = rows[0]
const binary = rows[1]
const hexadecimal = rows[3]

describe('row anchors', () => {
  it('names a row units cell by its last registered index', () => {
    expect(unitsCellKey(decimal)).toBe('decimal:4')
    expect(unitsCellKey(binary)).toBe('binary:15')
    expect(unitsCellKey(hexadecimal)).toBe('hexadecimal:3')
  })

  it('names the container a row breakdown renders into', () => {
    expect(breakdownIdFor(decimal)).toBe('decimal-place-value-breakdown')
  })
})

describe('tabFromUnits', () => {
  it('walks forward to the row own toggle', () => {
    expect(tabFromUnits(decimal, false)).toEqual({ kind: 'toggle', baseKey: 'decimal' })
  })

  it('walks backward to the previous row toggle', () => {
    expect(tabFromUnits(binary, true)).toEqual({ kind: 'toggle', baseKey: 'decimal' })
  })

  it('stops at the top of the page walking backward from the first row', () => {
    expect(tabFromUnits(decimal, true)).toBeNull()
  })
})

describe('tabFromToggle', () => {
  it('walks backward to its own units cell', () => {
    expect(tabFromToggle(decimal, true, true)).toEqual({ kind: 'cell', cellKey: 'decimal:4' })
  })

  it('walks forward into an open breakdown', () => {
    expect(tabFromToggle(decimal, false, true)).toEqual({
      kind: 'breakdown-term',
      breakdownId: 'decimal-place-value-breakdown',
    })
  })

  it('skips a closed breakdown for the next row units cell', () => {
    expect(tabFromToggle(decimal, false, false)).toEqual({ kind: 'cell', cellKey: 'binary:15' })
  })

  it('stops at the bottom of the page walking forward from the last row', () => {
    expect(tabFromToggle(hexadecimal, false, false)).toBeNull()
  })
})

describe('tabFromBreakdownTerm', () => {
  it('walks backward from the first term to the row toggle', () => {
    expect(tabFromBreakdownTerm(decimal, true, true, false)).toEqual({ kind: 'toggle', baseKey: 'decimal' })
  })

  it('leaves focus alone between terms', () => {
    expect(tabFromBreakdownTerm(decimal, true, false, false)).toBeNull()
    expect(tabFromBreakdownTerm(decimal, false, true, false)).toBeNull()
  })

  it('walks forward from the last term to the next row units cell', () => {
    expect(tabFromBreakdownTerm(decimal, false, false, true)).toEqual({ kind: 'cell', cellKey: 'binary:15' })
  })
})
