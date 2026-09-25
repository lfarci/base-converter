import type { KeyboardEvent, Ref } from 'react'
import type { Base } from './conversion'

type BaseHeaderCellProps = {
  base: Base
  isBreakdownOpen: boolean
  breakdownId: string
  toggleRef: Ref<HTMLButtonElement>
  onToggle: () => void
  onToggleKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
}

// The row's name cell: accent dot, the toggle that opens the row's place-value breakdown,
// and the radix. The toggle is the row's one Tab stop between the units digit above it
// and the next row below.
export function BaseHeaderCell({ base, isBreakdownOpen, breakdownId, toggleRef, onToggle, onToggleKeyDown }: BaseHeaderCellProps) {
  return (
    <th className="sticky left-0 z-10 w-[144px] border-b border-[#eef2f8] bg-inherit py-3 pr-2 align-top font-normal" scope="row" aria-label={base.name}>
      <span className="grid grid-cols-[8px_minmax(0,1fr)_20px] items-center gap-1.5">
        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: base.accent }} aria-hidden="true" />
        <button
          className="group inline-flex min-h-11 w-full min-w-0 cursor-pointer items-center justify-between gap-1 rounded-sm text-left text-[12px] font-bold text-[#172b4d] underline decoration-transparent underline-offset-4 transition hover:decoration-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2458d3]"
          type="button"
          ref={toggleRef}
          onKeyDown={onToggleKeyDown}
          aria-expanded={isBreakdownOpen}
          aria-controls={breakdownId}
          title={`Click to ${isBreakdownOpen ? 'close' : 'open'} the ${base.name.toLowerCase()} place-value breakdown`}
          aria-label={`Toggle ${base.name} place-value breakdown`}
          onClick={onToggle}
        >
          <span className="whitespace-nowrap">{base.name}</span>
        </button>
        <span className="w-5 text-right font-mono text-[11px] tabular-nums text-[#8190a5]">{base.radix}</span>
      </span>
    </th>
  )
}
