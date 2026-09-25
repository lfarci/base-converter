import type { KeyboardEvent, RefCallback } from 'react'
import { DigitRow } from './DigitRow'
import type { Base, BitSpan } from './conversion'

type DisplayedRow = { base: Base; boxes: string[] }

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
    <div className="mt-4 overflow-x-auto" role="region" aria-label="Scrollable base conversion table">
      <table className="w-full min-w-[768px] table-fixed border-separate border-spacing-0 text-left" aria-labelledby="result-title">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-[144px] border-b border-[#e3e9f1] bg-white pb-2 text-[10px] font-bold uppercase tracking-[0.9px] text-[#8190a5]" scope="col">Base</th>
            <th className="border-b border-[#e3e9f1] pb-2 pl-3 pr-3 text-[10px] font-bold uppercase tracking-[0.9px] text-[#8190a5]" scope="col">Digits and place values</th>
          </tr>
        </thead>
        <tbody>
          {displayed.map(({ base, boxes }) => (
            <DigitRow
              key={base.key}
              base={base}
              boxes={boxes}
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
