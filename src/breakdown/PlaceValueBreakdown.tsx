import type { KeyboardEvent } from 'react'
import { BreakdownTerm } from './BreakdownTerm'
import { BreakdownTotal } from './BreakdownTotal'
import { digitValue, type Base } from '../core/conversion'

type PlaceValueBreakdownProps = {
  base: Base
  boxes: string[]
  value: bigint | null
  isExpanded: boolean
  highlightedPosition: number | null
  onHoverPosition: (position: number | null) => void
  onFocusPosition: (position: number | null) => void
  onTabFromTerm: (event: KeyboardEvent<HTMLSpanElement>, base: Base, isFirst: boolean, isLast: boolean) => void
}

export function PlaceValueBreakdown({ base, boxes, value, isExpanded, highlightedPosition, onHoverPosition, onFocusPosition, onTabFromTerm }: PlaceValueBreakdownProps) {
  const terms = boxes.flatMap((digit, index) => {
    if (digit === '') return []
    const amount = digitValue(digit)
    if (amount === 0) return []
    const position = boxes.length - 1 - index
    return [{ digit, amount, position, contribution: BigInt(amount) * BigInt(base.radix) ** BigInt(position) }]
  })

  const contributions = terms.map(({ contribution }) => contribution)
  const compactMathLabel = `${terms.map(({ digit, amount, position }) => `${base.radix} to the power of ${position} times ${base.radix > 10 && amount >= 10 ? `${amount} (${digit})` : digit}`).join(' plus ')} equals ${value?.toLocaleString('en-US') ?? ''}`
  const hasNoValue = value === null || value === 0n

  return (
    <section className="place-value-breakdown border-l-2 border-frame bg-transparent py-4 pl-[154px] pr-4 text-left text-[13px] text-ink-soft" aria-label={`${base.name} place-value breakdown`}>
      <span className="breakdown-pressmark" aria-hidden="true" style={{ backgroundColor: base.accent }} />
      <h3 className="m-0 mono-tech text-[10px] uppercase tracking-[0.12em] text-ink-soft">Breakdown</h3>
      {hasNoValue ? (
        <p className="mb-0 mt-2 leading-relaxed">Breakdown for the value will be shown here when a value is entered.</p>
      ) : (
        <>
          {!isExpanded && (
            <p className="m-0 mt-1 flex flex-wrap items-baseline gap-x-1 gap-y-1 mono-tech text-[12px] text-ink" role="math" aria-label={compactMathLabel}>
              {terms.map(({ digit, amount, position }, index) => {
                const highlighted = highlightedPosition === position
                return (
                  <span
                    key={`${position}-${digit}`}
                    className="whitespace-nowrap rounded-sm border border-transparent px-1 py-0.5 underline-offset-4"
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
                    onMouseEnter={() => onHoverPosition(position)}
                    onMouseLeave={() => onHoverPosition(null)}
                  >
                    {index > 0 && <>{' + '}</>}
                    {base.radix}<sup>{position}</sup> &times; {base.radix > 10 && amount >= 10 ? `${amount} (${digit})` : digit}
                  </span>
                )
              })}
              <span className="whitespace-nowrap">= {value.toLocaleString('en-US')}</span>
            </p>
          )}
          <div
            className="breakdown-reveal"
            data-expanded={isExpanded || undefined}
            aria-hidden={!isExpanded}
            inert={!isExpanded}
          >
            <div className="breakdown-reveal-inner pt-1">
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 mono-tech text-[13px] text-ink">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {terms.map(({ digit, amount, position, contribution }, index) => (
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
                <BreakdownTotal contributions={contributions} total={value} />
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
