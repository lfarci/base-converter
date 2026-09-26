import type { KeyboardEvent } from 'react'
import { type Base } from '../core/conversion'

type BreakdownTermProps = {
  base: Base
  digit: string
  digitValue: number
  position: number
  contribution: bigint
  highlighted: boolean
  onHover: (position: number | null) => void
  onFocus: (position: number | null) => void
  onTab: (event: KeyboardEvent<HTMLSpanElement>) => void
}

// One non-zero digit of the breakdown, written as an equation: base to the power of the
// place, times the digit, equals what that place contributes to the total.
export function BreakdownTerm({ base, digit, digitValue: value, position, contribution, highlighted, onHover, onFocus, onTab }: BreakdownTermProps) {
  const displayedDigit = base.radix > 10 && value >= 10 ? `${value} (${digit})` : digit

  return (
    <span
      className="mono-tech rounded-sm border border-transparent px-1 py-0.5 underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus"
      role="math"
      tabIndex={0}
      data-breakdown-term="true"
      data-position={position}
      data-highlighted={highlighted || undefined}
      style={highlighted
        ? {
            backgroundColor: `color-mix(in srgb, ${base.accent} 12%, var(--color-well))`,
            borderColor: `color-mix(in srgb, ${base.accent} 55%, var(--color-ink))`,
            color: 'var(--color-ink)',
            fontWeight: 600,
            textDecoration: 'underline',
            textUnderlineOffset: '2px',
          }
        : undefined}
      aria-label={`${base.radix} to the power of ${position} times ${displayedDigit} equals ${contribution}`}
      onMouseEnter={() => onHover(position)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onFocus(position)}
      onBlur={() => onFocus(null)}
      onKeyDown={onTab}
    >
      {base.radix}<sup>{position}</sup> &times; {displayedDigit} = {contribution.toString()}
    </span>
  )
}
