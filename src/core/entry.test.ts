import { describe, expect, it } from 'vitest'
import { digitRange, LIMIT_MESSAGE, rows } from './conversion'
import {
  entryForDeletion,
  entryForDigit,
  entryForStep,
  initialEntryState,
  keyActionFor,
  type EntryState,
} from './entry'

const decimal = rows[0]
const binary = rows[1]
const hexadecimal = rows[3]

const noModifiers = { ctrlKey: false, metaKey: false, altKey: false }
const boxesFor = (...digits: string[]) => digits

function state(overrides: Partial<EntryState> = {}): EntryState {
  return { ...initialEntryState(), ...overrides }
}

describe('initialEntryState', () => {
  it('starts on the first row showing zero with nothing typed', () => {
    expect(initialEntryState()).toEqual({
      sourceKey: 'decimal',
      sourceDigits: '0',
      hasStartedDigitEntry: false,
      rejection: '',
    })
  })
})

describe('keyActionFor', () => {
  it('routes a digit the row base can hold', () => {
    expect(keyActionFor('5', noModifiers, 10, 10)).toEqual({ kind: 'digit', raw: '5' })
  })

  it('rejects a digit the row base cannot hold, leaving it to the change event', () => {
    expect(keyActionFor('2', noModifiers, 2, 2)).toBeNull()
    expect(keyActionFor('a', noModifiers, 10, 10)).toBeNull()
  })

  it('ignores digits typed with a modifier held', () => {
    expect(keyActionFor('5', { ...noModifiers, ctrlKey: true }, 10, 10)).toBeNull()
    expect(keyActionFor('5', { ...noModifiers, metaKey: true }, 10, 10)).toBeNull()
    expect(keyActionFor('5', { ...noModifiers, altKey: true }, 10, 10)).toBeNull()
  })

  it('routes the two deletion keys', () => {
    expect(keyActionFor('Backspace', noModifiers, 10, 10)).toEqual({ kind: 'delete' })
    expect(keyActionFor('Delete', noModifiers, 10, 10)).toEqual({ kind: 'delete' })
  })

  it('steps by one on the arrow keys', () => {
    expect(keyActionFor('ArrowUp', noModifiers, 10, 10)).toEqual({ kind: 'step', delta: 1n })
    expect(keyActionFor('ArrowDown', noModifiers, 10, 10)).toEqual({ kind: 'step', delta: -1n })
  })

  it('steps by a whole place on the page keys, judged by the base being written in', () => {
    expect(keyActionFor('PageUp', noModifiers, 10, 10)).toEqual({ kind: 'step', delta: 10n })
    expect(keyActionFor('PageDown', noModifiers, 10, 16)).toEqual({ kind: 'step', delta: -16n })
  })

  it('ignores keys it has no meaning for', () => {
    expect(keyActionFor('Enter', noModifiers, 10, 10)).toBeNull()
  })
})

describe('entryForDigit', () => {
  it('replaces the formatting zero with the first digit typed', () => {
    const update = entryForDigit(state(), decimal, boxesFor('0', '0', '0', '0', '0'), '5')

    expect(update?.state).toEqual({
      sourceKey: 'decimal',
      sourceDigits: '5',
      hasStartedDigitEntry: true,
      rejection: '',
    })
    expect(update?.focus).toEqual({ kind: 'cell', cellKey: 'decimal:4' })
  })

  it('appends further digits to the buffer', () => {
    const update = entryForDigit(state({ sourceDigits: '5', hasStartedDigitEntry: true }), decimal, boxesFor('0', '0', '0', '0', '5'), '3')

    expect(update?.state.sourceDigits).toBe('53')
  })

  it('moves a typed buffer into the new row, reading the row value once', () => {
    const update = entryForDigit(state({ sourceDigits: '255', hasStartedDigitEntry: true }), hexadecimal, boxesFor('0', '0', 'F', 'F'), 'A')

    expect(update?.state).toEqual({
      sourceKey: 'hexadecimal',
      sourceDigits: 'FFA',
      hasStartedDigitEntry: true,
      rejection: '',
    })
  })

  it('rejects a digit the row base cannot hold with the row own message', () => {
    const update = entryForDigit(state(), binary, boxesFor('0', '0'), '2')

    expect(update?.state.rejection).toBe(`Enter digits ${digitRange(2)} for base 2.`)
    expect(update?.state.sourceDigits).toBe('0')
    expect(update?.focus).toBeNull()
  })

  it('rejects the value that would pass the limit and leaves the grid intact', () => {
    const update = entryForDigit(state({ sourceDigits: '65535', hasStartedDigitEntry: true }), decimal, boxesFor('0', '6', '5', '5', '3'), '6')

    expect(update?.state.rejection).toBe(LIMIT_MESSAGE)
    expect(update?.state.sourceDigits).toBe('65535')
  })

  it('accepts the largest value exactly', () => {
    const update = entryForDigit(state({ sourceDigits: '6553', hasStartedDigitEntry: true }), decimal, boxesFor('0', '6', '5', '5', '3'), '5')

    expect(update?.state.rejection).toBe('')
    expect(update?.state.sourceDigits).toBe('65535')
  })

  it('uses the selected width for typing beyond the default 16-bit limit', () => {
    const current = '429496728'
    const stateWithCurrent = state({ sourceDigits: current, hasStartedDigitEntry: true })
    const boxes = Array.from(current)

    const update32 = entryForDigit(stateWithCurrent, decimal, boxes, '6', 32)
    const update64 = entryForDigit(stateWithCurrent, decimal, boxes, '6', 64)
    const tooLarge32 = entryForDigit(
      state({ sourceDigits: '429496729', hasStartedDigitEntry: true }),
      decimal,
      Array.from('429496729'),
      '6',
      32,
    )

    expect(update32?.state.sourceDigits).toBe('4294967286')
    expect(update32?.focus).toEqual({ kind: 'cell', cellKey: 'decimal:9' })
    expect(update64?.state.sourceDigits).toBe('4294967286')
    expect(update64?.focus).toEqual({ kind: 'cell', cellKey: 'decimal:19' })
    expect(tooLarge32?.state.rejection).toContain('4294967295')
  })

  it('rejects a buffer that outgrows the sixteen positions', () => {
    const update = entryForDigit(state({ sourceKey: 'binary', sourceDigits: '1'.repeat(16), hasStartedDigitEntry: true }), binary, boxesFor('1'), '1')

    expect(update?.state.rejection).toBe(LIMIT_MESSAGE)
  })

  it('ignores an empty change event', () => {
    expect(entryForDigit(state(), decimal, boxesFor('0', '0', '0', '0', '0'), '')).toBeNull()
  })
})

describe('entryForStep', () => {
  it('steps the number rather than the text, so 1011 in binary becomes 1100', () => {
    const update = entryForStep(state({ sourceKey: 'binary', sourceDigits: '1011' }), binary, 1n)

    expect(update?.state.sourceDigits).toBe('1100')
    expect(update?.state.rejection).toBe('')
    expect(update?.state.hasStartedDigitEntry).toBe(false)
  })

  it('steps down as well as up', () => {
    expect(entryForStep(state({ sourceKey: 'binary', sourceDigits: '1011' }), binary, -1n)?.state.sourceDigits).toBe('1010')
  })

  it('treats an empty source as zero', () => {
    expect(entryForStep(state({ sourceDigits: '' }), decimal, 1n)?.state.sourceDigits).toBe('1')
  })

  it('has nothing to give below zero', () => {
    const update = entryForStep(state({ sourceDigits: '' }), decimal, -1n)

    expect(update?.state.sourceDigits).toBe('0')
    expect(update?.state.rejection).toBe('')
    expect(update?.state.hasStartedDigitEntry).toBe(false)
    expect(update?.focus).toBeNull()
  })

  it('leaves the value alone and reports the limit when a step overshoots', () => {
    const update = entryForStep(state({ sourceDigits: '65535' }), decimal, 1n)

    expect(update?.state.rejection).toBe(LIMIT_MESSAGE)
    expect(update?.state.sourceDigits).toBe('65535')
  })

  it('steps up to the larger selected width limit', () => {
    const update = entryForStep(state({ sourceDigits: '4294967295' }), decimal, 1n, 64)

    expect(update?.state.sourceDigits).toBe('4294967296')
    expect(update?.state.rejection).toBe('')
  })

  it('refuses to resurface an old rejection on a step that lands on the limit', () => {
    const update = entryForStep(state({ sourceDigits: '65534', rejection: LIMIT_MESSAGE }), decimal, 1n)

    expect(update?.state.rejection).toBe('')
    expect(update?.state.sourceDigits).toBe('65535')
  })

  it('does nothing for a zero step or a source that is not a number', () => {
    expect(entryForStep(state({ sourceDigits: '5' }), decimal, 0n)).toBeNull()
    expect(entryForStep(state({ sourceKey: 'binary', sourceDigits: '2' }), binary, 1n)).toBeNull()
  })
})

describe('entryForDeletion', () => {
  it('drops the newest digit while a buffer is still being typed', () => {
    const update = entryForDeletion(state({ sourceDigits: '25', hasStartedDigitEntry: true }), decimal, boxesFor('0', '0', '0', '2', '5'))

    expect(update?.state.sourceDigits).toBe('2')
    expect(update?.state.hasStartedDigitEntry).toBe(true)
    expect(update?.focus).toEqual({ kind: 'cell', cellKey: 'decimal:4' })
  })

  it('returns to the untouched state once the buffer is emptied', () => {
    const update = entryForDeletion(state({ sourceDigits: '5', hasStartedDigitEntry: true }), decimal, boxesFor('0', '0', '0', '0', '5'))

    expect(update?.state.sourceDigits).toBe('0')
    expect(update?.state.hasStartedDigitEntry).toBe(false)
  })

  it('drops a whole place, a division rather than a truncation, outside a buffer', () => {
    const update = entryForDeletion(state({ sourceDigits: '255' }), decimal, boxesFor('0', '0', '2', '5', '5'))

    expect(update?.state.sourceDigits).toBe('25')
    expect(update?.state.hasStartedDigitEntry).toBe(false)
  })

  it('ends a buffer typed in another row rather than editing it', () => {
    const update = entryForDeletion(state({ sourceDigits: '255', hasStartedDigitEntry: true }), hexadecimal, boxesFor('0', '0', 'F', 'F'))

    expect(update?.state.sourceKey).toBe('hexadecimal')
    expect(update?.state.sourceDigits).toBe('F')
  })

  it('deletes from values above the default width', () => {
    const value = '18446744073709551615'
    const update = entryForDeletion(state({ sourceKey: 'decimal', sourceDigits: value }), decimal, Array.from(value), 64)

    expect(update?.state.sourceDigits).toBe('1844674407370955161')
    expect(update?.focus).toEqual({ kind: 'cell', cellKey: 'decimal:19' })
  })

  it('does nothing while the row is empty', () => {
    const update = entryForDeletion(state({ sourceDigits: '' }), decimal, boxesFor('', '', '', '', ''))

    expect(update?.state.sourceDigits).toBe('0')
    expect(update?.state.hasStartedDigitEntry).toBe(false)
  })
})
