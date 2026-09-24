import { MAX_SAFE_INTEGER, maxDigitsFor, type Base } from './bases'

export type Validation = {
  value: bigint | null
  error: string
}

export function validateNumber(raw: string, base: Base): Validation {
  if (!raw) return { value: null, error: '' }

  if (!base.pattern.test(raw)) {
    return { value: null, error: `Enter digits ${base.digits} for base ${base.radix}.` }
  }

  const value = BigInt(`${base.prefix}${raw}`)

  if (value > MAX_SAFE_INTEGER) {
    return { value: null, error: 'That number is too large to convert accurately. Try a smaller whole number.' }
  }

  return { value, error: '' }
}

export function clampToMaxDigits(raw: string, base: Base): string {
  const maxDigits = maxDigitsFor(base.radix)
  if (raw.length <= maxDigits) return raw

  const significant = raw.replace(/^0+/, '')
  return significant ? significant.slice(0, maxDigits) : raw.slice(-maxDigits)
}
