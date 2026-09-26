import {
  digitRange,
  digitsForValue,
  errorForParsed,
  limitMessageForPositions,
  padToPositions,
  POSITIONS,
  positionsForBase,
  rows,
  type Base,
  type ParsedDigits,
} from './conversion'

export type DisplayedRow = {
  base: Base
  boxes: string[]
  isSource: boolean
}

export function sourceBaseFor(sourceKey: string) {
  return rows.find((base) => base.key === sourceKey) ?? rows[0]
}

// What the page shows above the rows. The value is null while the source row does not hold
// a number yet, so every other row renders blank rather than zero.
export function statusFor(parsed: ParsedDigits, base: Base, rejection: string, positions = POSITIONS) {
  const error = rejection || errorForParsed(parsed, base.radix, limitMessageForPositions(positions))
  const help = parsed.status === 'empty'
    ? 'Nothing typed yet — ↑ starts at 1, ↓ stays at 0.'
    : `Reading base ${base.radix}, digits ${digitRange(base.radix)}. Type into another row's units box to write in that base instead, or use Arrow Up/Down to step the value by one.`
  return { error, message: error || help, value: parsed.status === 'ok' ? parsed.value : null }
}

// Each row uses only the places that fit within the 16-bit limit, with leading zeros in
// those places. An empty source renders blank; zero stays visible.
export function displayedRows(sourceKey: string, sourceDigits: string, value: bigint | null, positions = POSITIONS): DisplayedRow[] {
  return rows.map((base) => {
    const isSource = base.key === sourceKey
    const digits = isSource ? Array.from(sourceDigits) : value === null ? [] : digitsForValue(value, base.radix)
    const hasValue = isSource ? sourceDigits.length > 0 : value !== null
    const places = positionsForBase(base.radix, positions)

    return {
      base,
      boxes: hasValue ? padToPositions(digits, places) : Array.from({ length: places }, () => ''),
      isSource,
    }
  })
}
