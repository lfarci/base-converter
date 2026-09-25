export function HelpDetails() {
  return (
    <details className="mt-3 border border-rule bg-paper-3 text-[13px] text-ink-soft">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
        <span className="font-mono text-[12px]" aria-hidden="true">[?]</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink">How to use</span>
      </summary>
      <p className="mb-0 max-w-[65ch] border-t border-rule-soft px-3 py-3 leading-relaxed">
        Each row has one writable box, its units place on the right; the rest are read-only readouts of the same value. Type there and that row becomes the source, with the others converting automatically. Tab moves from each row's units digit to its base-name toggle, which opens or closes that row's breakdown, then to the next row. When a breakdown is open, its terms are included in the Tab order. Digits shift left as you type; Backspace and Delete remove the newest digit. With a box focused, ↑ and ↓ change the value by one, and Page Up / Page Down change it by a whole place. Each row shows only the digit places that fit within the 16-bit limit; octal and hexadecimal digits are labeled with the bits they represent.
      </p>
    </details>
  )
}
