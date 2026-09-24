export type Base = {
  key: string
  name: string
  radix: number
  subscript: string
  hint: string
  digits: string
  prefix: string
  pattern: RegExp
  accent: string
}

export const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER)

export const bases: Base[] = [
  { key: 'decimal', name: 'Decimal', radix: 10, subscript: '₁₀', hint: 'Base 10 · digits 0–9', digits: '0–9', prefix: '', pattern: /^\d+$/, accent: 'border-l-[#e8aa42]' },
  { key: 'binary', name: 'Binary', radix: 2, subscript: '₂', hint: 'Base 2 · digits 0–1', digits: '0–1', prefix: '0b', pattern: /^[01]+$/, accent: 'border-l-[#4381e6]' },
  { key: 'octal', name: 'Octal', radix: 8, subscript: '₈', hint: 'Base 8 · digits 0–7', digits: '0–7', prefix: '0o', pattern: /^[0-7]+$/, accent: 'border-l-[#37a88d]' },
  { key: 'hexadecimal', name: 'Hexadecimal', radix: 16, subscript: '₁₆', hint: 'Base 16 · digits 0–9 and A–F', digits: '0–9 and A–F', prefix: '0x', pattern: /^[\da-f]+$/i, accent: 'border-l-[#9170d7]' },
]

export const baseKeys = bases.map(({ key }) => key)

export function findBase(key: string): Base {
  return bases.find((base) => base.key === key) ?? bases[0]
}

export function maxDigitsFor(radix: number): number {
  return Number.MAX_SAFE_INTEGER.toString(radix).length
}

export function formatValue(value: bigint, radix: number): string {
  return value.toString(radix).toUpperCase()
}
