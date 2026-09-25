import { describe, expect, it } from 'vitest'
import { digitRange, LIMIT_MESSAGE, parseDigits, rows, VALUE_LIMIT } from './conversion'
import { displayedRows, sourceBaseFor, statusFor } from './display'

const decimal = rows[0]
const binary = rows[1]

describe('sourceBaseFor', () => {
  it('finds the base a row key names', () => {
    expect(sourceBaseFor('binary')).toBe(binary)
  })

  it('falls back to the first row for a key that no longer exists', () => {
    expect(sourceBaseFor('roman')).toBe(decimal)
  })
})

describe('statusFor', () => {
  it('shows the value once the source row holds a number', () => {
    expect(statusFor({ status: 'ok', value: 255n }, decimal, '').value).toBe(255n)
  })

  it('shows no value while nothing is typed, so other rows render blank', () => {
    expect(statusFor({ status: 'empty' }, decimal, '').value).toBeNull()
  })

  it('prefers a rejection over the parser own message', () => {
    const status = statusFor({ status: 'ok', value: 1n }, decimal, LIMIT_MESSAGE)

    expect(status.error).toBe(LIMIT_MESSAGE)
    expect(status.message).toBe(LIMIT_MESSAGE)
    expect(status.value).toBe(1n)
  })

  it('surfaces the parser own message when nothing was rejected', () => {
    const status = statusFor({ status: 'invalid', char: 'X' }, binary, '')

    expect(status.error).toBe(`Enter digits ${digitRange(2)} for base 2.`)
    expect(status.value).toBeNull()
  })

  it('explains the stepping keys while the source row is empty', () => {
    expect(statusFor({ status: 'empty' }, decimal, '').message).toContain('Nothing typed yet')
  })

  it('names the base being read while a value is present', () => {
    expect(statusFor({ status: 'ok', value: 1n }, binary, '').message).toContain('Reading base 2')
  })
})

describe('displayedRows', () => {
  it('gives every row the places its base can use inside the limit', () => {
    const displayed = displayedRows('decimal', '0', 0n)

    expect(displayed.map(({ base, boxes }) => [base.key, boxes.length])).toEqual([
      ['decimal', 5],
      ['binary', 16],
      ['octal', 6],
      ['hexadecimal', 4],
    ])
  })

  it('keeps zero visible and pads it with leading zeros', () => {
    const displayed = displayedRows('decimal', '0', 0n)

    expect(displayed[0].boxes).toEqual(['0', '0', '0', '0', '0'])
    expect(displayed[1].boxes.at(-1)).toBe('0')
  })

  it('renders blank boxes when the source row is empty', () => {
    const displayed = displayedRows('decimal', '', null)

    expect(displayed[0].boxes).toEqual(['', '', '', '', ''])
    expect(displayed[1].boxes).toHaveLength(16)
    expect(displayed[1].boxes.every((box) => box === '')).toBe(true)
  })

  it('rewrites the other rows from the shared value', () => {
    const displayed = displayedRows('decimal', '255', 255n)
    const binaryRow = displayed.find(({ base }) => base.key === 'binary')

    expect(displayed[0].boxes).toEqual(['0', '0', '2', '5', '5'])
    expect(binaryRow?.boxes.join('')).toBe('0000000011111111')
  })

  it('shows the typed text in the source row rather than a reformatted value', () => {
    const displayed = displayedRows('binary', '0001', 1n)

    expect(displayed.find(({ base }) => base.key === 'binary')?.boxes.join('')).toBe('0000000000000001')
  })

  it('marks the largest value with the parser own verdict', () => {
    expect(parseDigits(VALUE_LIMIT.toString(10), 10)).toEqual({ status: 'ok', value: VALUE_LIMIT })
    expect(parseDigits((VALUE_LIMIT + 1n).toString(10), 10).status).toBe('too-large')
  })
})
