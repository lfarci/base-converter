import type { KeyboardEvent } from 'react'
import { digitValue, type Base } from './conversion'

type PlaceValueBreakdownProps = {
  base: Base
  boxes: string[]
  value: bigint | null
  highlightedPosition: number | null
  onHoverPosition: (position: number | null) => void
  onFocusPosition: (position: number | null) => void
  onTabFromTerm: (event: KeyboardEvent<HTMLSpanElement>, base: Base, isFirst: boolean, isLast: boolean) => void
}

export function PlaceValueBreakdown({ base, boxes, value, highlightedPosition, onHoverPosition, onFocusPosition, onTabFromTerm }: PlaceValueBreakdownProps) {
  const terms = boxes.flatMap((digit, index) => {
    if (digit === '') return []
    const digitNumber = digitValue(digit)
    if (digitNumber === 0) return []
    const position = boxes.length - 1 - index
    const contribution = BigInt(digitNumber) * BigInt(base.radix) ** BigInt(position)
    const displayedDigit = base.radix > 10 && digitNumber >= 10 ? `${digitNumber} (${digit})` : digit
    return [{ digit: displayedDigit, position, contribution }]
  })
  const total = value?.toString() ?? ''

  return (
    <section className="py-2 pl-4 pr-0 text-xs text-[#63728a]" aria-label={`${base.name} place-value breakdown`}>
      <h3 className="m-0 text-[10px] font-medium text-[#8190a5]">Breakdown</h3>
      {value === null ? (
        <p className="mb-0 mt-2 leading-relaxed">Enter a valid value to see this row's place-value breakdown.</p>
      ) : (
        <div className="mt-1 flex flex-wrap items-baseline gap-x-5 gap-y-1 font-mono text-[12px] text-[#33445f]">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {terms.length === 0 ? (
              <span role="math" aria-label="Zero equals zero">0 = 0</span>
            ) : terms.map(({ digit, position, contribution }, index) => (
              <span
                className="rounded-sm border border-transparent px-1 py-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2458d3]"
                key={`${position}-${digit}`}
                role="math"
                tabIndex={0}
                data-breakdown-term="true"
                data-position={position}
                data-highlighted={highlightedPosition === position || undefined}
                style={highlightedPosition === position ? { backgroundColor: `color-mix(in srgb, ${base.accent} 12%, white)`, borderColor: base.accent, color: '#172b4d', fontWeight: 600 } : undefined}
                aria-label={`${base.radix} to the power of ${position} times ${digit} equals ${contribution}`}
                onMouseEnter={() => onHoverPosition(position)}
                onMouseLeave={() => onHoverPosition(null)}
                onFocus={() => onFocusPosition(position)}
                onBlur={() => onFocusPosition(null)}
                onKeyDown={(event) => {
                  if (event.key === 'Tab') onTabFromTerm(event, base, index === 0, index === terms.length - 1)
                }}
              >
                {base.radix}<sup>{position}</sup> &times; {digit} = {contribution.toString()}
              </span>
            ))}
          </div>
          {terms.length > 0 && (
            <span className="border-l border-[#dbe3ee] pl-4 font-semibold text-[#172b4d]" role="math" aria-label={`${terms.map(({ contribution }) => contribution.toString()).join(' plus ')} equals ${total}`}>
              {terms.map(({ contribution }, index) => (
                <span key={`${index}-${contribution}`}>
                  {index > 0 && <span aria-hidden="true"> + </span>}
                  {contribution.toString()}
                </span>
              ))} <span aria-hidden="true">→</span> {total}
            </span>
          )}
        </div>
      )}
    </section>
  )
}
