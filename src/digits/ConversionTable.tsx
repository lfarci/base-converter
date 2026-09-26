import { useState, type KeyboardEvent, type RefCallback } from 'react'
import { DigitRow } from './DigitRow'
import type { DisplayedRow } from '../core/display'
import type { Base, BitSpan } from '../core/conversion'

type ConversionTableProps = {
  displayed: DisplayedRow[]
  value: bigint | null
  highlightedBits: BitSpan | null
  onHoverPosition: (base: Base, position: number | null) => void
  onFocusPosition: (base: Base, position: number | null) => void
  onDigitKeyDown: (event: KeyboardEvent<HTMLInputElement>, base: Base, boxes: string[]) => void
  onEditDigit: (base: Base, boxes: string[], raw: string) => void
  registerCell: (cellKey: string) => RefCallback<HTMLInputElement>
  registerBreakdownToggle: (key: string) => RefCallback<HTMLButtonElement>
  registerBreakdownControl: RefCallback<HTMLButtonElement>
  onTabFromBreakdownControl: (event: KeyboardEvent<HTMLButtonElement>, shiftKey: boolean) => void
  onTabFromUnits: (event: KeyboardEvent<HTMLInputElement>, base: Base) => void
  onTabFromToggle: (event: KeyboardEvent<HTMLButtonElement>, base: Base, breakdownOpen: boolean) => void
  onTabFromBreakdownTerm: (event: KeyboardEvent<HTMLSpanElement>, base: Base, isFirst: boolean, isLast: boolean) => void
}

export function ConversionTable({ displayed, value, highlightedBits, onHoverPosition, onFocusPosition, onDigitKeyDown, onEditDigit, registerCell, registerBreakdownToggle, registerBreakdownControl, onTabFromBreakdownControl, onTabFromUnits, onTabFromToggle, onTabFromBreakdownTerm }: ConversionTableProps) {
  const [openBreakdowns, setOpenBreakdowns] = useState<Set<string>>(() => new Set())
  const areAllBreakdownsOpen = displayed.every(({ base }) => openBreakdowns.has(base.key))

  const toggleAllBreakdowns = () => {
    setOpenBreakdowns(areAllBreakdownsOpen ? new Set() : new Set(displayed.map(({ base }) => base.key)))
  }

  return (
    /* A framed ledger block. The outer frame stays separate from the scroll region, so it
       draws the edge without adding horizontal padding to the digits `ol` inside. */
    <div className="border border-frame">
      <div className="flex min-h-11 items-center justify-end border-b border-rule-soft bg-paper-3 px-3">
        <button
          className="min-h-11 cursor-pointer rounded-sm px-1 text-xs text-ink-soft transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          type="button"
          ref={registerBreakdownControl}
          onClick={toggleAllBreakdowns}
          onKeyDown={(event) => {
            if (event.key === 'Tab') onTabFromBreakdownControl(event, event.shiftKey)
          }}
        >
          {areAllBreakdownsOpen ? 'Hide all breakdowns' : 'Show all breakdowns'}
        </button>
      </div>
      <div className="overflow-x-auto" role="region" aria-label="Scrollable base conversion table">
        <table className="w-full min-w-[768px] table-fixed border-separate border-spacing-0 text-left" aria-labelledby="result-title">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 w-[144px] border-b-2 border-t border-rule border-b-frame bg-paper-3 px-3 pb-1.5 pt-2 mono-tech text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft" scope="col">Base</th>
              <th className="border-b-2 border-t border-rule border-b-frame bg-paper-3 pb-1.5 pl-3 pr-3 pt-2 mono-tech text-[10px] font-bold uppercase tracking-[0.12em] text-ink-soft" scope="col">Digits and place values</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map(({ base, boxes, isSource }) => (
              <DigitRow
                key={base.key}
                base={base}
                boxes={boxes}
                isSource={isSource}
                value={value}
                highlightedBits={highlightedBits}
                isBreakdownOpen={openBreakdowns.has(base.key)}
                onToggleBreakdown={() => setOpenBreakdowns((open) => {
                  const next = new Set(open)
                  if (next.has(base.key)) next.delete(base.key)
                  else next.add(base.key)
                  return next
                })}
                onHoverPosition={(position) => onHoverPosition(base, position)}
                onFocusPosition={(position) => onFocusPosition(base, position)}
                onDigitKeyDown={onDigitKeyDown}
                onEditDigit={onEditDigit}
                registerCell={registerCell}
                registerBreakdownToggle={registerBreakdownToggle}
                onTabFromUnits={onTabFromUnits}
                onTabFromToggle={onTabFromToggle}
                onTabFromBreakdownTerm={onTabFromBreakdownTerm}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
