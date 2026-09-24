import { type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { DigitRow } from './DigitRow'
import {
  bitSpanForDigit,
  digitRange,
  digitValue,
  digitsForValue,
  LIMIT_MESSAGE,
  pageStep,
  padToPositions,
  parseDigits,
  pickTypedChar,
  positionsForBase,
  POSITIONS,
  rows,
  VALUE_LIMIT,
  type Base,
  type BitSpan,
} from './conversion'

function App() {
  const [sourceKey, setSourceKey] = useState('decimal')
  const [sourceDigits, setSourceDigits] = useState('0')
  const [hasStartedDigitEntry, setHasStartedDigitEntry] = useState(false)
  const [rejection, setRejection] = useState('')
  const [hoveredBits, setHoveredBits] = useState<BitSpan | null>(null)
  const [focusedBits, setFocusedBits] = useState<BitSpan | null>(null)

  const sourceBase = rows.find((base) => base.key === sourceKey) ?? rows[0]
  const parsed = parseDigits(sourceDigits, sourceBase.radix)
  const value = parsed.status === 'ok' ? parsed.value : null
  const error = rejection
    || (parsed.status === 'too-large' ? LIMIT_MESSAGE : '')
    || (parsed.status === 'invalid' ? `Enter digits ${digitRange(sourceBase.radix)} for base ${sourceBase.radix}.` : '')
  const help = parsed.status === 'empty'
      ? 'Nothing typed yet — ↑ starts at 1, ↓ stays at 0.'
      : `Reading base ${sourceBase.radix}, digits ${digitRange(sourceBase.radix)}. Type in another row to write in that base instead, or use Arrow Up/Down to step the value by one.`

  // Each row uses only the places that fit within the 16-bit limit, with leading
  // zeros in those places. An empty source renders blank; zero stays visible.
  const displayed = rows.map((base) => {
    const isSource = base.key === sourceKey
    const digits = isSource ? Array.from(sourceDigits) : value === null ? [] : digitsForValue(value, base.radix)
    const hasValue = isSource ? sourceDigits.length > 0 : value !== null
    return {
      base,
      isSource,
      boxes: hasValue
        ? padToPositions(digits, positionsForBase(base.radix))
        : Array.from({ length: positionsForBase(base.radix) }, () => ''),
    }
  })

  // Every digit box registers itself here by base and place, so the editable
  // surface can put the caret back without hunting through the DOM.
  const cellsRef = useRef(new Map<string, HTMLInputElement>())
  const breakdownTogglesRef = useRef(new Map<string, HTMLButtonElement>())
  const focusRowControl = (event: KeyboardEvent, base: Base, direction: -1 | 1) => {
    const rowIndex = rows.findIndex((row) => row.key === base.key)
    const targetRow = rows[rowIndex + direction]
    if (!targetRow) return

    event.preventDefault()
    if (direction === 1) cellsRef.current.get(`${targetRow.key}:${positionsForBase(targetRow.radix) - 1}`)?.focus()
    else breakdownTogglesRef.current.get(targetRow.key)?.focus()
  }
  const focusToggleFromUnits = (event: React.KeyboardEvent<HTMLInputElement>, base: Base) => {
    if (event.shiftKey) {
      focusRowControl(event, base, -1)
      return
    }

    event.preventDefault()
    breakdownTogglesRef.current.get(base.key)?.focus()
  }
  const focusUnitsFromToggle = (event: React.KeyboardEvent<HTMLButtonElement>, base: Base, breakdownOpen: boolean) => {
    if (event.shiftKey) {
      event.preventDefault()
      cellsRef.current.get(`${base.key}:${positionsForBase(base.radix) - 1}`)?.focus()
      return
    }

    if (breakdownOpen) {
      const firstTerm = document.getElementById(`${base.key}-place-value-breakdown`)?.querySelector<HTMLElement>('[data-breakdown-term]')
      if (firstTerm) {
        event.preventDefault()
        firstTerm.focus()
        return
      }
    }

    focusRowControl(event, base, 1)
  }
  const focusUnitsFromBreakdownTerm = (event: React.KeyboardEvent<HTMLSpanElement>, base: Base, isFirst: boolean, isLast: boolean) => {
    if (event.shiftKey && isFirst) {
      event.preventDefault()
      breakdownTogglesRef.current.get(base.key)?.focus()
    } else if (!event.shiftKey && isLast) {
      focusRowControl(event, base, 1)
    }
  }
  // Restore focus after edits commit so the caret stays anchored through React rerenders.
  const pendingFocusRef = useRef<string | null>(null)
  const caretIsInSurface = (node: Element | null = document.activeElement) =>
    node instanceof HTMLInputElement && node.dataset.digit === 'true'

  // Focus the units place on the active row. Other boxes remain reachable by mouse
  // or by advancing through digits, but do not add fifteen extra Tab stops per row.
  const focusEditable = () => {
    cellsRef.current.get(`${sourceBase.key}:${positionsForBase(sourceBase.radix) - 1}`)?.focus()
  }

  const focusEditableRef = useRef(focusEditable)
  useEffect(() => {
    focusEditableRef.current = focusEditable
  })

  useEffect(() => {
    const where = pendingFocusRef.current
    pendingFocusRef.current = null
    if (where === 'rightmost') focusEditableRef.current()
    else if (where) cellsRef.current.get(where)?.focus()
  })


  // Focus policy: aiming at a control is a deliberate choice and wins, so the links
  // stay usable. Anything else — a release on plain content, a stray keypress, coming
  // back to the tab — hands the caret back so the next digit lands in the number. The
  // page's own actions (stepping) ask for the caret themselves once they have finished.
  useEffect(() => {
    const aimedAtAControl = (target: EventTarget | null) =>
      target instanceof Element && target.closest('input, button, select, textarea, label, a[href]') !== null
    const returnToSurface = (event: Event) => {
      if (event.type === 'keydown' && (event as globalThis.KeyboardEvent).key === 'Tab') return
      if (aimedAtAControl(event.target) || caretIsInSurface()) return
      focusEditableRef.current()
    }

    document.addEventListener('pointerup', returnToSurface)
    document.addEventListener('keydown', returnToSurface)
    return () => {
      document.removeEventListener('pointerup', returnToSurface)
      document.removeEventListener('keydown', returnToSurface)
    }
  }, [])

  // Stepping works on the number, never on the text: in binary 1011 steps up to
  // 1100. Empty counts as zero, so the first step up starts at 1 and the first step
  // down has nothing to give. Stepping up past the limit leaves the value alone and
  // raises the same message the row would raise on its own.
  const stepValue = (delta: bigint) => {
    if (delta === 0n || parsed.status === 'invalid') return
    const current = parsed.status === 'empty' ? 0n : parsed.value
    const target = current + delta
    if (target < 0n) {
      setRejection('')
      setSourceDigits('0')
      setHasStartedDigitEntry(false)
      return
    }
    if (target > VALUE_LIMIT) {
      setRejection(LIMIT_MESSAGE)
      return
    }
    setRejection('')
    setSourceDigits(target.toString(sourceBase.radix))
    setHasStartedDigitEntry(false)
  }

  // Arrow keys step by one; Page Up/Down step by a whole place — ten in the bases we
  // read as tens and units, sixteen from base 11 up where a place is a nibble wider.
  const editDigit = (base: Base, boxes: string[], index: number, raw: string, focusKey?: string) => {
    if (raw.length > 0) {
      const char = pickTypedChar(raw, boxes[index])
      const digit = digitValue(char)
      if (digit < 0 || digit >= base.radix) {
        setRejection(`Enter digits ${digitRange(base.radix)} for base ${base.radix}.`)
        return
      }

      const current = parseDigits(boxes.join(''), base.radix)
      const currentDigits = !hasStartedDigitEntry
        ? ''
        : base.key === sourceKey
          ? sourceDigits
          : current.status === 'ok'
            ? digitsForValue(current.value, base.radix).join('')
            : ''
      const nextDigits = `${currentDigits}${char}`
      const nextValue = parseDigits(nextDigits, base.radix)
      if (nextDigits.length > POSITIONS || nextValue.status === 'too-large') {
        setRejection(LIMIT_MESSAGE)
        return
      }

      setRejection('')
      setSourceKey(base.key)
      setSourceDigits(nextDigits)
      setHasStartedDigitEntry(true)
      pendingFocusRef.current = 'rightmost'
      return
    }

    const next = boxes.slice()
    next[index] = '0'
    const typed = parseDigits(next.join(''), base.radix)
    if (typed.status === 'too-large') {
      setRejection(LIMIT_MESSAGE)
      return
    }

    setRejection('')
    setSourceKey(base.key)
    setSourceDigits(typed.status === 'ok' ? digitsForValue(typed.value, base.radix).join('') : '')
    setHasStartedDigitEntry(typed.status === 'ok' && typed.value !== 0n)
    const nextFocusKey = focusKey ?? `${base.key}:${Math.max(index - 1, 0)}`
    cellsRef.current.get(nextFocusKey)?.focus()
    pendingFocusRef.current = nextFocusKey
  }

  const onCellKeyDown = (event: KeyboardEvent<HTMLInputElement>, base: Base, boxes: string[], index: number) => {
    const digit = digitValue(event.key)
    if (!event.ctrlKey && !event.metaKey && !event.altKey && digit >= 0 && digit < base.radix) {
      event.preventDefault()
      editDigit(base, boxes, index, event.key)
      return
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      const current = parseDigits(boxes.join(''), base.radix)
      if (current.status === 'invalid' || current.status === 'too-large') return

      const nextValue = current.status === 'empty' ? 0n : current.value / BigInt(base.radix)
      const isTypedEntryBuffer = hasStartedDigitEntry && base.key === sourceKey
      const nextDigits = isTypedEntryBuffer
        ? sourceDigits.slice(0, -1)
        : digitsForValue(nextValue, base.radix).join('')
      const nextDigitsValue = parseDigits(nextDigits, base.radix)
      const resolvedDigits = nextDigitsValue.status === 'ok' && nextDigitsValue.value !== 0n
        ? nextDigits
        : '0'
      setRejection('')
      setSourceKey(base.key)
      setSourceDigits(resolvedDigits)
      setHasStartedDigitEntry(
        isTypedEntryBuffer && nextDigitsValue.status === 'ok' && nextDigitsValue.value !== 0n,
      )
      pendingFocusRef.current = 'rightmost'
      return
    }

    const up = event.key === 'ArrowUp' || event.key === 'PageUp'
    const down = event.key === 'ArrowDown' || event.key === 'PageDown'
    if (!up && !down) return
    event.preventDefault()
    const magnitude = event.key === 'PageUp' || event.key === 'PageDown' ? pageStep(sourceBase.radix) : 1n
    stepValue(up ? magnitude : -magnitude)
  }

  return (
    <main className="mx-auto w-full px-4 pb-16 text-[#172b4d] sm:px-6 lg:max-w-[920px]" id="top">
      <header className="flex items-baseline justify-between py-6 sm:py-8">
        <a className="text-[15px] font-bold tracking-tight text-[#172b4d] no-underline" href="#top" tabIndex={-1}>basewise</a>
        <span className="text-[11px] text-[#63728a]">positional notation, plainly</span>
      </header>

      <section aria-labelledby="page-title">
        <h1 className="mt-5 text-[clamp(22px,3.4vw,28px)] font-bold leading-tight tracking-[-0.6px]" id="page-title">
          One number, any base
        </h1>
        <p className="mt-2 max-w-[54ch] text-[13px] leading-relaxed text-[#63728a]">
          Type straight into a row below. That row becomes the base you are writing in, and every other row rewrites itself as you go.
        </p>

        <div className="mt-8">
          <h2 className="m-0 text-xs font-semibold text-[#63728a]" id="result-title">The same value, written out</h2>
          <p className="mt-1.5 max-w-[60ch] text-xs leading-relaxed text-[#8190a5]">
            Each position is numbered from zero on the right and labeled under its box. Open the breakdown below to see how each non-zero digit contributes to the same total.
          </p>
          <details className="mt-1 text-xs text-[#63728a]">
            <summary className="flex min-h-11 cursor-pointer items-center font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2458d3]">How to use</summary>
            <p className="mb-2 max-w-[65ch] leading-relaxed text-[#8190a5]">
              Type into any row; it becomes the source, and the others convert automatically. Tab moves from each row's units digit to its breakdown toggle beside the base name, then to the next row. Digits shift left as you type; Backspace and Delete remove the newest digit. With a box focused, ↑ and ↓ change the value by one, and Page Up / Page Down change it by a whole place. Each row shows only the digit places that fit within the 16-bit limit; octal and hexadecimal digits are labeled with the bits they represent.
            </p>
          </details>

          <div className="mt-4 overflow-x-auto" role="region" aria-label="Scrollable base conversion table">
            <table className="w-full min-w-[768px] table-fixed border-separate border-spacing-0 text-left" aria-labelledby="result-title">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-[176px] border-b border-[#e3e9f1] bg-white pb-2 text-[10px] font-bold uppercase tracking-[0.9px] text-[#8190a5]" scope="col">Base</th>
                  <th className="border-b border-[#e3e9f1] pb-2 pl-3 pr-3 text-[10px] font-bold uppercase tracking-[0.9px] text-[#8190a5]" scope="col">Digits and place values</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(({ base, boxes }) => (
                  <DigitRow
                    key={base.key}
                    base={base}
                    boxes={boxes}
                    value={value}
                    highlightedBits={hoveredBits ?? focusedBits}
                    onHoverPosition={(position) => setHoveredBits(position === null ? null : bitSpanForDigit(base.radix, position))}
                    onFocusPosition={(position) => setFocusedBits(position === null ? null : bitSpanForDigit(base.radix, position))}
                    onDigitKeyDown={onCellKeyDown}
                    onEditDigit={editDigit}
                    registerCell={(cellKey) => (node) => {
                      if (node) cellsRef.current.set(cellKey, node)
                      else cellsRef.current.delete(cellKey)
                    }}
                    registerBreakdownToggle={(key) => (node) => {
                      if (node) breakdownTogglesRef.current.set(key, node)
                      else breakdownTogglesRef.current.delete(key)
                    }}
                    onTabFromUnits={focusToggleFromUnits}
                    onTabFromToggle={focusUnitsFromToggle}
                    onTabFromBreakdownTerm={focusUnitsFromBreakdownTerm}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <p className={`mt-3 min-h-5 text-xs leading-relaxed ${error ? 'text-[#a52736]' : 'text-[#63728a]'}`} id="edit-status" role={error ? 'alert' : 'status'}>
            {error || help}
          </p>
        </div>

        <p className="mt-10 border-t border-[#e7edf5] pt-5 text-xs leading-relaxed text-[#63728a]">
          The number itself never changes — only the symbols that hold it. Each row shows all of its available places, and octal and hexadecimal show which bits combine to make each digit.
        </p>
      </section>
    </main>
  )
}

export default App
