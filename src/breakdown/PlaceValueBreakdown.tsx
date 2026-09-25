import type { KeyboardEvent } from 'react'
import { BreakdownTerm } from './BreakdownTerm'
import { BreakdownTotal } from './BreakdownTotal'
import { digitValue, type Base } from '../core/conversion'

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
    const amount = digitValue(digit)
    if (amount === 0) return []
    const position = boxes.length - 1 - index
    return [{ digit, amount, position, contribution: BigInt(amount) * BigInt(base.radix) ** BigInt(position) }]
  })

  return (
    /* The worked calculation, inset onto the field surface. The 2px left rule plus pl-[14px]
           stays exactly as it was so the heading still lines up with the digit grid (P6):
           140px (cell) + 2px (rule) + 14px = 156px = 144 + 12. */
        <section className="border-l-2 border-frame bg-well py-3 pl-[14px] pr-3 text-[13px] text-ink-soft" aria-label={`${base.name} place-value breakdown`}>
          <h3 className="m-0 mono-tech text-[10px] uppercase tracking-[0.12em] text-ink-soft">Breakdown</h3>
          {value === null ? (
            <p className="mb-0 mt-2 leading-relaxed">Enter a valid value to see this row's place-value breakdown.</p>
          ) : (
            <div className="mt-1 flex flex-wrap items-baseline gap-x-5 gap-y-1 mono-tech text-[13px] text-ink">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {terms.length === 0 ? (
              <span role="math" aria-label="Zero equals zero">0 = 0</span>
            ) : terms.map(({ digit, amount, position, contribution }, index) => (
              <BreakdownTerm
                key={`${position}-${digit}`}
                base={base}
                digit={digit}
                digitValue={amount}
                position={position}
                contribution={contribution}
                highlighted={highlightedPosition === position}
                onHover={onHoverPosition}
                onFocus={onFocusPosition}
                onTab={(event) => {
                  if (event.key === 'Tab') onTabFromTerm(event, base, index === 0, index === terms.length - 1)
                }}
              />
            ))}
          </div>
          {terms.length > 0 && (
            <BreakdownTotal contributions={terms.map(({ contribution }) => contribution)} total={value.toString()} />
          )}
        </div>
      )}
    </section>
  )
}
