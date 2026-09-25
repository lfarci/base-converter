import { bitRangeForDigit, type Base } from '../core/conversion'

type PlaceValueLabelProps = {
  base: Base
  position: number
  highlighted: boolean
}

// The caption under a digit box: its place number, plus the bits the digit represents in
// the bases whose digits are whole groups of binary bits.
export function PlaceValueLabel({ base, position, highlighted }: PlaceValueLabelProps) {
  const bitRange = bitRangeForDigit(base.radix, position)

  return (
    <span
      className="place-value-label flex flex-col items-center gap-0.5 whitespace-nowrap rounded-sm border border-transparent px-0.5 py-0.5 text-center font-mono text-[10px] leading-tight text-ink-soft"
      data-position={position}
      data-highlighted={highlighted || undefined}
      style={highlighted
        ? {
            backgroundColor: `color-mix(in srgb, ${base.accent} 12%, var(--color-paper-2))`,
            borderColor: `color-mix(in srgb, ${base.accent} 70%, var(--color-ink))`,
            color: 'var(--color-ink)',
            fontWeight: 600,
            textDecoration: 'underline',
            textUnderlineOffset: '2px',
          }
        : undefined}
    >
      <span>{position}</span>
      {bitRange && <span className="text-[9px] text-ink-soft">{bitRange}</span>}
    </span>
  )
}
