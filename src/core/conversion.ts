export const DIGIT_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const POSITIONS = 16
export const BIT_WIDTHS = [8, 16, 32] as const

export function valueLimitForPositions(positions: number) {
  return 2n ** BigInt(positions) - 1n
}

export function limitMessageForPositions(positions: number) {
  return `That number is too large. ${positions} positions hold at most ${valueLimitForPositions(positions)}.`
}

export const VALUE_LIMIT = valueLimitForPositions(POSITIONS)
export const LIMIT_MESSAGE = limitMessageForPositions(POSITIONS)

export type Base = {
  key: string
  name: string
  radix: number
  accent: string
}

export const rows: Base[] = [
  { key: 'decimal', name: 'Decimal', radix: 10, accent: '#e69f00' },
  { key: 'binary', name: 'Binary', radix: 2, accent: '#0072b2' },
  { key: 'octal', name: 'Octal', radix: 8, accent: '#009e73' },
  { key: 'hexadecimal', name: 'Hexadecimal', radix: 16, accent: '#cc79a7' },
]

export type ParsedDigits =
  | { status: 'empty' }
  | { status: 'invalid'; char: string }
  | { status: 'too-large'; value: bigint }
  | { status: 'ok'; value: bigint }

export type BitSpan = { low: number; high: number }

export function digitRange(radix: number) {
  return radix <= 10 ? `0–${radix - 1}` : `0–9 and A–${DIGIT_ALPHABET[radix - 1]}`
}

export function digitValue(char: string) {
  return DIGIT_ALPHABET.indexOf(char.toUpperCase())
}

export function parseDigits(text: string, radix: number, limit: bigint = VALUE_LIMIT): ParsedDigits {
  if (text.length === 0) return { status: 'empty' }

  let value = 0n
  const scale = BigInt(radix)

  for (const char of text.toUpperCase()) {
    const digit = digitValue(char)
    if (digit < 0 || digit >= radix) return { status: 'invalid', char }
    value = value * scale + BigInt(digit)
  }

  return value > limit ? { status: 'too-large', value } : { status: 'ok', value }
}

export function widthsUnableToHold(parsed: ParsedDigits, widths: readonly number[]) {
  if (parsed.status !== 'ok' && parsed.status !== 'too-large') return []
  return widths.filter((width) => parsed.value > valueLimitForPositions(width))
}

export function digitsForValue(value: bigint, radix: number) {
  return Array.from(value.toString(radix).toUpperCase())
}

export function positionsForBase(radix: number, positions = POSITIONS) {
  return valueLimitForPositions(positions).toString(radix).length
}

export function bitsPerDigit(radix: number) {
  return Math.log2(radix)
}

// Radix 8 and 16 are the bases whose digits are whole groups of binary bits, so their
// boxes span the bits they represent and line up with the binary row.
export function usesBitGrid(radix: number) {
  return radix > 2 && Number.isInteger(bitsPerDigit(radix))
}

export function bitSpanForDigit(radix: number, position: number, positions = POSITIONS): BitSpan | null {
  const width = bitsPerDigit(radix)
  if (!usesBitGrid(radix)) return null

  const low = position * width
  const high = Math.min(low + width - 1, positions - 1)
  return { low, high }
}

export function bitRangeForDigit(radix: number, position: number, positions = POSITIONS) {
  const span = bitSpanForDigit(radix, position, positions)
  if (!span) return null

  const { low, high } = span
  return high === low ? `bit ${low}` : `bits ${high}–${low}`
}

export function padToPositions(digits: string[], positions = POSITIONS) {
  const zeros = Array.from({ length: Math.max(positions - digits.length, 0) }, () => '0')
  return [...zeros, ...digits].slice(-positions)
}

export function pickTypedChar(raw: string, previous: string) {
  const text = raw.toUpperCase()
  if (text.length <= 1) return text
  return Array.from(text).find((char) => char !== previous.toUpperCase()) ?? text.slice(-1)
}

export function pageStep(radix: number) {
  return radix <= 10 ? 10n : 16n
}

// The message a rejection shows is exactly the "too large" notice the parser produces,
// so the status line reads the same whichever path rejected the input.
export function errorForParsed(parsed: ParsedDigits, radix: number, limitMessage = LIMIT_MESSAGE) {
  if (parsed.status === 'too-large') return limitMessage
  if (parsed.status === 'invalid') return `Enter digits ${digitRange(radix)} for base ${radix}.`
  return ''
}
