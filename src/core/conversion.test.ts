import { describe, expect, it } from 'vitest'
import {
  bitSpanForDigit,
  digitsForValue,
  limitMessageForPositions,
  LIMIT_MESSAGE,
  pageStep,
  padToPositions,
  parseDigits,
  pickTypedChar,
  POSITIONS,
  positionsForBase,
  valueLimitForPositions,
  VALUE_LIMIT,
  widthsUnableToHold,
} from './conversion'

describe('parseDigits', () => {
  it('reports the four states with their payload', () => {
    expect(parseDigits('', 10)).toEqual({ status: 'empty' })
    expect(parseDigits('2', 2)).toEqual({ status: 'invalid', char: '2' })
    expect(parseDigits('65536', 10)).toEqual({ status: 'too-large', value: 65536n })
    expect(parseDigits('65535', 10)).toEqual({ status: 'ok', value: VALUE_LIMIT })
  })

  it('reads digits case-insensitively, so FF is the same number as ff', () => {
    expect(parseDigits('ff', 16)).toEqual({ status: 'ok', value: 255n })
  })

  it('supports width-specific limits at 8, 16, and 32 bits', () => {
    const limit8 = valueLimitForPositions(8)
    const limit32 = valueLimitForPositions(32)

    expect(parseDigits('255', 10, limit8)).toEqual({ status: 'ok', value: limit8 })
    expect(parseDigits('256', 10, limit8).status).toBe('too-large')
    expect(limitMessageForPositions(8)).toContain('255')
    expect(parseDigits('4294967295', 10, limit32)).toEqual({ status: 'ok', value: limit32 })
    expect(parseDigits('4294967296', 10, limit32).status).toBe('too-large')
  })
})

describe('width availability', () => {
  it('marks every width that cannot hold an ok or too-large parsed value', () => {
    expect(widthsUnableToHold({ status: 'ok', value: 256n }, [8, 16, 32])).toEqual([8])
    expect(widthsUnableToHold({ status: 'too-large', value: 2n ** 32n }, [8, 16, 32])).toEqual([8, 16, 32])
    expect(widthsUnableToHold({ status: 'empty' }, [8, 16, 32])).toEqual([])
    expect(widthsUnableToHold({ status: 'invalid', char: '?' }, [8, 16, 32])).toEqual([])
  })
})

describe('digit rendering', () => {
  it('writes a value out in its base and pads it to the visible places', () => {
    expect(digitsForValue(255n, 16)).toEqual(['F', 'F'])
    expect(padToPositions(['F', 'F'], 4)).toEqual(['0', '0', 'F', 'F'])
  })

  it('pads to a fixed sixteen places by default', () => {
    expect(padToPositions(['1'])).toHaveLength(POSITIONS)
  })

  it('keeps only the places that fit the selected bit width', () => {
    expect(positionsForBase(10)).toBe(5)
    expect(positionsForBase(2)).toBe(16)
    expect(positionsForBase(8)).toBe(6)
    expect(positionsForBase(16)).toBe(4)
    expect(positionsForBase(10, 8)).toBe(3)
    expect(positionsForBase(2, 8)).toBe(8)
    expect(positionsForBase(8, 8)).toBe(3)
    expect(positionsForBase(16, 8)).toBe(2)
    expect(positionsForBase(10, 32)).toBe(10)
    expect(positionsForBase(2, 32)).toBe(32)
    expect(positionsForBase(8, 32)).toBe(11)
    expect(positionsForBase(16, 32)).toBe(8)
  })

  it('clips a padded value rather than growing past its places', () => {
    expect(padToPositions(['1', '2', '3'], 2)).toEqual(['2', '3'])
  })
})

describe('pickTypedChar', () => {
  it('upper-cases a single character', () => {
    expect(pickTypedChar('a', '0')).toBe('A')
  })

  it('picks the character that differs from the one already in the box', () => {
    expect(pickTypedChar('12', '1')).toBe('2')
    expect(pickTypedChar('12', '2')).toBe('1')
  })

  it('falls back to the last character when nothing differs', () => {
    expect(pickTypedChar('11', '1')).toBe('1')
  })
})

describe('bit spans', () => {
  it('clip the highest octal group to the 16-bit limit', () => {
    expect(bitSpanForDigit(8, 0)).toEqual({ low: 0, high: 2 })
    expect(bitSpanForDigit(8, 5)).toEqual({ low: 15, high: 15 })
    expect(bitSpanForDigit(16, 2)).toEqual({ low: 8, high: 11 })
    expect(bitSpanForDigit(8, 10, 32)).toEqual({ low: 30, high: 31 })
    expect(bitSpanForDigit(16, 7, 32)).toEqual({ low: 28, high: 31 })
    expect(bitSpanForDigit(10, 0)).toBeNull()
  })
})

describe('pageStep', () => {
  it('steps by ten in the bases read as tens and units, and by sixteen above that', () => {
    expect(pageStep(10)).toBe(10n)
    expect(pageStep(2)).toBe(10n)
    expect(pageStep(11)).toBe(16n)
    expect(pageStep(16)).toBe(16n)
  })
})

describe('LIMIT_MESSAGE', () => {
  it('names the cap it enforces', () => {
    expect(LIMIT_MESSAGE).toContain('65535')
    expect(LIMIT_MESSAGE).toContain(`${POSITIONS} positions`)
  })
})
