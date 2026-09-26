/* A squared monitor body, an inset screen and a short keyboard line, drawn on the pixel
   grid. Purely ornamental: aria-hidden, currentColor so it inherits the masthead ink and
   survives forced-colors, and removable without touching layout or meaning. */
function MonitorMark() {
  return (
    <svg
      aria-hidden="true"
      className="shrink-0"
      fill="none"
      height="28"
      shapeRendering="crispEdges"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 28 28"
      width="28"
    >
      <rect height="17" width="24" x="2" y="2" />
      <rect height="11" width="18" x="5" y="5" />
      <rect height="3" width="8" x="10" y="19" />
      <rect height="3" width="16" x="6" y="23" />
    </svg>
  )
}

export function PageHeader() {
  return (
    <header className="border-t-[3px] border-b-4 border-solid border-ink border-b-double border-b-rule pt-4 pb-3 sm:pt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <a className="flex items-center gap-2 font-display text-[21px] leading-none font-bold tracking-[-0.4px] text-ink no-underline" href="#top" tabIndex={-1}>
          <MonitorMark />
          Base Converter
        </a>
        <span className="mono-tech text-[11px] uppercase tracking-[0.12em] text-ink-soft">positional notation, plainly</span>
      </div>
    </header>
  )
}
