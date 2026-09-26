import {
  digitRange,
  digitValue,
  digitsForValue,
  limitMessageForPositions,
  pageStep,
  parseDigits,
  pickTypedChar,
  POSITIONS,
  rows,
  valueLimitForPositions,
  type Base,
} from './conversion'
import { unitsCellKey, type FocusTarget } from './focus'

// Everything a keystroke can change about the value being entered. App.tsx holds this as
// one piece of state; the functions below are the only things allowed to move it.
export type EntryState = {
  sourceKey: string
  sourceDigits: string
  hasStartedDigitEntry: boolean
  rejection: string
}

// The next state plus, when the caret should be put back, where it goes. A step or a
// rejection leaves the caret alone and reports no target.
export type EntryUpdate = {
  state: EntryState
  focus: FocusTarget | null
}

export type KeyAction =
  | { kind: 'digit'; raw: string }
  | { kind: 'delete' }
  | { kind: 'step'; delta: bigint }

export function initialEntryState(): EntryState {
  return { sourceKey: rows[0].key, sourceDigits: '0', hasStartedDigitEntry: false, rejection: '' }
}

// A key is only routed as an edit when the row it was typed in can hold that digit and no
// modifier is held; anything else is left to the browser, which reports it through the
// input's change event instead. A digit is judged against the row's own base, but a page
// step is judged against the base the number is being written in.
export function keyActionFor(
  key: string,
  modifiers: { ctrlKey: boolean; metaKey: boolean; altKey: boolean },
  rowRadix: number,
  stepRadix: number,
): KeyAction | null {
  const digit = digitValue(key)
  if (!modifiers.ctrlKey && !modifiers.metaKey && !modifiers.altKey && digit >= 0 && digit < rowRadix) {
    return { kind: 'digit', raw: key }
  }

  if (key === 'Delete' || key === 'Backspace') return { kind: 'delete' }

  const up = key === 'ArrowUp' || key === 'PageUp'
  const down = key === 'ArrowDown' || key === 'PageDown'
  if (!up && !down) return null

  // Arrow keys step by one; Page Up/Down step by a whole place — ten in the bases we read
  // as tens and units, sixteen from base 11 up where a place is a nibble wider.
  const magnitude = key === 'PageUp' || key === 'PageDown' ? pageStep(stepRadix) : 1n
  return { kind: 'step', delta: up ? magnitude : -magnitude }
}

function reject(state: EntryState, rejection: string): EntryUpdate {
  return { state: { ...state, rejection }, focus: null }
}

// Only the units box is writable, so an edit appends the newest digit to the active value
// rather than replacing the place the caret happens to sit in.
export function entryForDigit(state: EntryState, base: Base, boxes: string[], raw: string, positions = POSITIONS): EntryUpdate | null {
  if (raw.length === 0) return null

  const char = pickTypedChar(raw, boxes[boxes.length - 1])
  const digit = digitValue(char)
  if (digit < 0 || digit >= base.radix) {
    return reject(state, `Enter digits ${digitRange(base.radix)} for base ${base.radix}.`)
  }

  const limit = valueLimitForPositions(positions)
  const current = parseDigits(boxes.join(''), base.radix, limit)
  const currentDigits = !state.hasStartedDigitEntry
    ? ''
    : base.key === state.sourceKey
      ? state.sourceDigits
      : current.status === 'ok'
        ? digitsForValue(current.value, base.radix).join('')
        : ''
  const nextDigits = `${currentDigits}${char}`
  const nextValue = parseDigits(nextDigits, base.radix, limit)
  if (nextDigits.length > positions || nextValue.status === 'too-large') {
    return reject(state, limitMessageForPositions(positions))
  }

  return {
    state: { sourceKey: base.key, sourceDigits: nextDigits, hasStartedDigitEntry: true, rejection: '' },
    focus: { kind: 'cell', cellKey: unitsCellKey(base, positions) },
  }
}

// Stepping works on the number, never on the text: in binary 1011 steps up to 1100. Empty
// counts as zero, so the first step up starts at 1 and the first step down has nothing to
// give. Stepping up past the limit leaves the value alone and raises the same message the
// row would raise on its own.
export function entryForStep(state: EntryState, base: Base, delta: bigint, positions = POSITIONS): EntryUpdate | null {
  const limit = valueLimitForPositions(positions)
  const parsed = parseDigits(state.sourceDigits, base.radix, limit)
  if (delta === 0n || parsed.status === 'invalid') return null

  const current = parsed.status === 'empty' ? 0n : parsed.value
  const target = current + delta
  if (target < 0n) {
    return { state: { ...state, rejection: '', sourceDigits: '0', hasStartedDigitEntry: false }, focus: null }
  }
  if (target > limit) return reject(state, limitMessageForPositions(positions))

  return {
    state: { ...state, rejection: '', sourceDigits: target.toString(base.radix), hasStartedDigitEntry: false },
    focus: null,
  }
}

// Delete and Backspace drop the newest digit. While digits are still being typed they drop
// the last one typed; once a value has been stepped or formatted they drop the last place
// of the number itself, which is a division rather than a truncation of the text.
export function entryForDeletion(state: EntryState, base: Base, boxes: string[], positions = POSITIONS): EntryUpdate | null {
  const current = parseDigits(boxes.join(''), base.radix, valueLimitForPositions(positions))
  if (current.status === 'invalid' || current.status === 'too-large') return null

  const nextValue = current.status === 'empty' ? 0n : current.value / BigInt(base.radix)
  const isTypedEntryBuffer = state.hasStartedDigitEntry && base.key === state.sourceKey
  const nextDigits = isTypedEntryBuffer
    ? state.sourceDigits.slice(0, -1)
    : digitsForValue(nextValue, base.radix).join('')
  const nextDigitsValue = parseDigits(nextDigits, base.radix, valueLimitForPositions(positions))
  const isEmpty = nextDigitsValue.status !== 'ok' || nextDigitsValue.value === 0n

  return {
    state: {
      sourceKey: base.key,
      sourceDigits: isEmpty ? '0' : nextDigits,
      hasStartedDigitEntry: isTypedEntryBuffer && !isEmpty,
      rejection: '',
    },
    focus: { kind: 'cell', cellKey: unitsCellKey(base, positions) },
  }
}
