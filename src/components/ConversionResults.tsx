import { formatValue, type Base } from '../bases'

type ConversionResultsProps = {
  visibleBases: Base[]
  value: bigint | null
}

export function ConversionResults({ visibleBases, value }: ConversionResultsProps) {
  return (
    <>
      <div className="mb-[14px] flex items-center justify-between gap-3">
        <h2 className="m-0 text-[15px] font-bold text-[#172b4d]">Same value, different bases</h2>
        <span className="text-[9px] font-bold tracking-[1.1px] text-[#71819a]">{visibleBases.length} SHOWN</span>
      </div>

      <div className="space-y-3" aria-live="polite" aria-atomic="true">
        {visibleBases.length ? visibleBases.map((base) => (
          <article className={`min-w-0 rounded-[10px] border border-[#e3e9f1] border-l-[3px] p-4 ${base.accent}`} key={base.key}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="m-0 text-sm font-bold text-[#172b4d]">{base.name}</h3>
              <span className="whitespace-nowrap rounded-[5px] bg-[#f1f4f8] px-2 py-1 text-[9px] font-bold tracking-wide text-[#566881]">BASE {base.radix}</span>
            </div>
            <p className="my-3 wrap-anywhere font-mono text-[clamp(24px,6vw,30px)] font-semibold leading-tight tabular-nums text-[#172b4d]">
              {value !== null ? formatValue(value, base.radix) : '—'}
              <span className="ml-0.5 text-base font-medium text-[#2458d3]">{base.subscript}</span>
            </p>
            <p className="m-0 text-xs leading-snug text-[#63728a]">{base.hint}</p>
          </article>
        )) : (
          <p className="m-0 rounded-lg border border-dashed border-[#cdd7e5] p-4 text-sm text-[#63728a]">Select one or more bases to see their conversions.</p>
        )}
      </div>
    </>
  )
}
