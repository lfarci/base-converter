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

// The row's name cell: the colored disclosure marker, the base name, and the radix. The
// toggle is the row's one Tab stop between the units digit above it and the next row below.
export function BaseHeaderCell({ base, isSource, isBreakdownOpen, breakdownId, toggleRef, onToggle, onToggleKeyDown }: BaseHeaderCellProps) {
  return (
    <th className="sticky left-0 z-10 w-[144px] border-b border-dotted border-rule bg-inherit py-3 pl-2 pr-2 align-top font-normal" scope="row" aria-label={`${base.name}${isSource ? ', source' : ''}`} data-source={isSource || undefined}>
      {/* A shape cue, not a hue cue: the source row is marked by a solid ink bar at the
          cell's left edge. It is absolutely positioned and aria-hidden, so it never moves
          the cell's own metrics and never adds an announcement. */}
      {isSource && (
        <div className="absolute left-0 top-0 h-full w-[3px] bg-ink" aria-hidden="true" />
      )}
      <button
        className="group relative inline-flex min-h-11 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-sm text-left font-display text-[14px] font-normal tracking-[-0.04em] text-ink"
        type="button"
        ref={toggleRef}
        onKeyDown={onToggleKeyDown}
        aria-expanded={isBreakdownOpen}
        aria-controls={breakdownId}
        title={`Click to ${isBreakdownOpen ? 'close' : 'open'} the ${base.name.toLowerCase()} place-value breakdown`}
        aria-label={`Toggle ${base.name} place-value breakdown`}
        onClick={onToggle}
      >
        <span className="inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap">
          <svg
            className="base-disclosure size-3 shrink-0"
            viewBox="0 0 12 12"
            fill="currentColor"
            stroke="color-mix(in srgb, currentColor 55%, var(--color-ink))"
            strokeWidth={1}
            strokeLinejoin="round"
            style={{ color: base.accent }}
            data-expanded={isBreakdownOpen || undefined}
            aria-hidden="true"
          >
            <path d="M3 1.5 10.5 6 3 10.5Z" />
          </svg>
          <span className="underline decoration-transparent underline-offset-4 transition group-hover:decoration-current group-focus-visible:decoration-current">{base.name}</span>
        </span>
        <span className="mono-tech w-5 shrink-0 text-right text-[10px] text-ink-soft">{base.radix}</span>
        {isSource && <span className="source-indicator absolute left-0 top-0 mono-tech text-[9px] leading-none font-bold uppercase tracking-[0.08em] text-ink-soft">SOURCE</span>}
      </button>
    </th>
  )
}
