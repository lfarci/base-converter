import { bitRangeForDigit, type Base } from './conversion'

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
      className="place-value-label flex flex-col items-center gap-0.5 whitespace-nowrap rounded-sm border border-transparent px-0.5 py-0.5 font-mono text-[9px] leading-none text-[#63728a]"
      data-position={position}
      data-highlighted={highlighted || undefined}
      style={highlighted ? { backgroundColor: `color-mix(in srgb, ${base.accent} 12%, white)`, borderColor: base.accent, color: '#172b4d', fontWeight: 600 } : undefined}
    >
      <span>{position}</span>
      {bitRange && <span className="text-[8px] text-[#8190a5]">{bitRange}</span>}
    </span>
  )
}
