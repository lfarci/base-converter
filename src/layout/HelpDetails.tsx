export function HelpDetails() {
  return (
    /* Self-sized: the border hugs the label so this reads as a utility control rather than
       a full-width band of prose competing with the converter panel's title bar. */
    <details className="mt-3 w-fit max-w-full border border-rule bg-paper-3 text-[13px] text-ink-soft">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
        <span className="mono-tech flex size-5 shrink-0 items-center justify-center border-2 border-frame text-[11px] font-bold leading-none text-ink" aria-hidden="true">?</span>
        <span className="mono-tech text-[11px] uppercase tracking-[0.12em] text-ink">How to use</span>
      </summary>
      <p className="mb-0 max-w-[65ch] border-t border-rule-soft px-3 py-3 leading-relaxed">
        Type in the rightmost box of any row to use that base. The other rows update automatically. Choose a 16-, 32-, or 64-bit width above the table to change the maximum value. Smaller widths are unavailable when they would truncate the current value. Open a row’s breakdown to see how each digit contributes to the value. Keyboard: ↑ / ↓ change the value by one. Backspace/Delete remove a digit.
      </p>
    </details>
  )
}
