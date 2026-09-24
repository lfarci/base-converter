export function Header() {
  return (
    <header className="flex h-[70px] items-center justify-between border-b border-[#e3e9f1] sm:h-[88px]">
      <a className="flex items-center gap-2.5 text-[17px] font-bold tracking-tight text-[#172b4d] no-underline" href="#top" aria-label="Basewise home">
        <span className="grid size-[30px] place-items-center rounded-[9px] bg-[#2458d3] font-mono text-base text-white" aria-hidden="true">B</span>
        <span>basewise</span>
      </a>
      <span className="text-[11px] text-[#63728a] sm:text-[13px]">A little number sense</span>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="mt-auto flex min-h-[58px] items-center justify-between border-t border-[#e3e9f1] text-[8px] font-bold tracking-[0.6px] text-[#75839a] sm:min-h-16 sm:text-[9px] sm:tracking-[1px]">
      <span>BASEWISE <span aria-hidden="true">·</span> A SIMPLE STUDY TOOL</span>
      <span>CHOOSE A BASE · EXPLORE THE CONVERSIONS</span>
    </footer>
  )
}

export function InfoNote() {
  return (
    <aside className="mt-[17px] flex items-start gap-3 rounded-[10px] border border-[#e7edf5] bg-[#f5f8fc] p-[13px] sm:p-[15px_18px]">
      <span className="grid size-[19px] shrink-0 place-items-center rounded-full border border-[#9aafd0] font-serif text-xs font-bold italic text-[#506b91]" aria-hidden="true">i</span>
      <p className="m-0 text-xs leading-relaxed text-[#4f6078]"><strong className="text-[#172b4d]">What changes?</strong> The number stays the same; only the symbols change. The small number beside each result tells you which base it uses.</p>
    </aside>
  )
}
