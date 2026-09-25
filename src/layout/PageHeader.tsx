/* A squared monitor body, an inset screen and a short keyboard line, drawn on the pixel
   grid. Purely ornamental: aria-hidden, currentColor so it inherits the masthead ink and
   survives forced-colors, and removable without touching layout or meaning. */
function MonitorMark() {
  return (
    <svg
      aria-hidden="true"
      className="shrink-0"
      fill="none"
      height="20"
      shapeRendering="crispEdges"
      stroke="currentColor"
      strokeWidth="1.25"
      viewBox="0 0 20 20"
      width="20"
    >
      <rect height="12" rx="1" width="18" x="1" y="2.5" />
      <rect height="7" width="14" x="3" y="5" />
      <rect height="3" rx="0.5" width="18" x="1" y="15.5" />
    </svg>
  )
}

export function PageHeader() {
  return (
    <header className="border-t-[3px] border-b-4 border-solid border-ink border-b-double border-b-rule pt-4 pb-3 sm:pt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <a className="flex items-center gap-2 font-display text-[21px] leading-none font-bold tracking-[-0.4px] text-ink no-underline" href="#top" tabIndex={-1}>
          <MonitorMark />
          basewise
        </a>
        <span className="mono-tech text-[11px] uppercase tracking-[0.12em] text-ink-soft">positional notation, plainly</span>
      </div>
    </header>
  )
}
