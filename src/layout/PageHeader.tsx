export function PageHeader() {
  return (
    <header className="border-b-4 border-double border-rule pb-3 pt-6 sm:pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <a className="font-display text-[21px] font-bold tracking-[-0.4px] text-ink no-underline" href="#top" tabIndex={-1}>basewise</a>
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">positional notation, plainly</span>
      </div>
    </header>
  )
}
