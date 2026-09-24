export const DIGIT_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const POSITIONS = 16
export const VALUE_LIMIT = 2n ** BigInt(POSITIONS) - 1n
export const LIMIT_MESSAGE = `That number is too large. ${POSITIONS} positions hold at most ${VALUE_LIMIT}.`

export type Base = {
  key: string
  name: string
  radix: number
  accent: string
}

export const rows: Base[] = [
  { key: 'decimal', name: 'Decimal', radix: 10, accent: '#e8aa42' },
  { key: 'binary', name: 'Binary', radix: 2, accent: '#4381e6' },
  { key: 'octal', name: 'Octal', radix: 8, accent: '#37a88d' },
  { key: 'hexadecimal', name: 'Hexadecimal', radix: 16, accent: '#9170d7' },
]

export type ParsedDigits =
  | { status: 'empty' }
  | { status: 'invalid'; char: string }
  | { status: 'too-large'; value: bigint }
  | { status: 'ok'; value: bigint }

export type BitGroup = {
  bits: string[]
  placeholders: number
  label: string
}

export type BitGrouping = {
  base: Base
  size: number
  groups: BitGroup[]
}

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

export function digitsForValue(value: bigint, radix: number) {
  return Array.from(value.toString(radix).toUpperCase())
}

export function padToPositions(digits: string[]) {
  const zeros = Array.from({ length: Math.max(POSITIONS - digits.length, 0) }, () => '0')
  return [...zeros, ...digits].slice(-POSITIONS)
}

export function pickTypedChar(raw: string, previous: string) {
  const text = raw.toUpperCase()
  if (text.length <= 1) return text
  return Array.from(text).find((char) => char !== previous.toUpperCase()) ?? text.slice(-1)
}

export function bitsPerDigit(radix: number) {
  if (radix === 8) return 3
  if (radix === 16) return 4
  return null
}

export function groupBits(bits: string[], size: number, radix: number): BitGroup[] {
  const groups: BitGroup[] = []

  for (let end = bits.length; end > 0; end -= size) {
    const chunk = bits.slice(Math.max(0, end - size), end)
    const parsed = parseDigits(chunk.join(''), 2)
    groups.unshift({
      bits: chunk,
      placeholders: size - chunk.length,
      label: (parsed.status === 'ok' ? parsed.value : 0n).toString(radix).toUpperCase(),
    })
  }

  return groups
}

export function pageStep(radix: number) {
  return radix <= 10 ? 10n : 16n
}
