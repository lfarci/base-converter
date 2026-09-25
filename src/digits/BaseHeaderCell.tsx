import type { KeyboardEvent, Ref } from 'react'
import type { Base } from '../core/conversion'

type BaseHeaderCellProps = {
  base: Base
  isSource: boolean
  isBreakdownOpen: boolean
  breakdownId: string
  toggleRef: Ref<HTMLButtonElement>
  onToggle: () => void
  onToggleKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
}

// The row's name cell: accent chip, the toggle that opens the row's place-value breakdown,
// and the radix. The toggle is the row's one Tab stop between the units digit above it
// and the next row below.
export function BaseHeaderCell({ base, isSource, isBreakdownOpen, breakdownId, toggleRef, onToggle, onToggleKeyDown }: BaseHeaderCellProps) {
  return (
    <th className="sticky left-0 z-10 w-[144px] border-b border-dotted border-rule bg-inherit py-3 pl-2 pr-2 align-top font-normal" scope="row" aria-label={base.name} data-source={isSource || undefined}>
      {/* A shape cue, not a hue cue: the source row is marked by a solid ink bar at the
          cell's left edge. It is absolutely positioned and aria-hidden, so it never moves
          the cell's own metrics and never adds an announcement. */}
      {isSource && (
        <div className="absolute left-0 top-0 h-full w-[3px] bg-ink" aria-hidden="true" />
      )}
      <span className="grid grid-cols-[8px_minmax(0,1fr)_20px] items-center gap-1.5">
        <span className="size-2 shrink-0 rounded-[1px]" style={{ backgroundColor: base.accent }} aria-hidden="true" />
        <button
          className="group inline-flex min-h-11 w-full min-w-0 cursor-pointer items-center justify-between gap-1 rounded-sm text-left font-display text-[13px] font-bold text-ink underline decoration-transparent underline-offset-4 transition hover:decoration-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
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
        <span className="mono-tech w-5 text-right text-[11px] text-ink-soft">{base.radix}</span>
      </span>
    </th>
  )
}
