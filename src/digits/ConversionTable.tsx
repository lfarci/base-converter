import type { KeyboardEvent, RefCallback } from 'react'
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
  onTabFromUnits: (event: KeyboardEvent<HTMLInputElement>, base: Base) => void
  onTabFromToggle: (event: KeyboardEvent<HTMLButtonElement>, base: Base, breakdownOpen: boolean) => void
  onTabFromBreakdownTerm: (event: KeyboardEvent<HTMLSpanElement>, base: Base, isFirst: boolean, isLast: boolean) => void
}

export function ConversionTable({ displayed, value, highlightedBits, onHoverPosition, onFocusPosition, onDigitKeyDown, onEditDigit, registerCell, registerBreakdownToggle, onTabFromUnits, onTabFromToggle, onTabFromBreakdownTerm }: ConversionTableProps) {
  return (
    /* A framed ledger block. The frame is on the scroll region rather than the table, so it
           draws the outer edge without adding horizontal padding to the digits `ol` inside — the
           first and last digit boxes still align to the grid's own edges. */
        <div className="overflow-x-auto border border-frame" role="region" aria-label="Scrollable base conversion table">
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
  )
}
