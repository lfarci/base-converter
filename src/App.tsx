import { type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { ConversionTable } from './ConversionTable'
import { HelpDetails } from './HelpDetails'
import { PageHeader } from './PageHeader'
import { StatusLine } from './StatusLine'
import {
  bitSpanForDigit,
  digitRange,
  digitValue,
  digitsForValue,
  errorForParsed,
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

// What the page shows above the rows. The value is null while the source row does not
// hold a number yet, so every other row renders blank rather than zero.
function describe(parsed: ReturnType<typeof parseDigits>, base: Base, rejection: string) {
  const error = rejection || errorForParsed(parsed, base.radix)
  const help = parsed.status === 'empty'
    ? 'Nothing typed yet — ↑ starts at 1, ↓ stays at 0.'
    : `Reading base ${base.radix}, digits ${digitRange(base.radix)}. Type into another row's units box to write in that base instead, or use Arrow Up/Down to step the value by one.`
  return { error, message: error || help, value: parsed.status === 'ok' ? parsed.value : null }
}

function App() {
  const [sourceKey, setSourceKey] = useState('decimal')
  const [sourceDigits, setSourceDigits] = useState('0')
  const [hasStartedDigitEntry, setHasStartedDigitEntry] = useState(false)
  const [rejection, setRejection] = useState('')
  const [hoveredBits, setHoveredBits] = useState<BitSpan | null>(null)
  const [focusedBits, setFocusedBits] = useState<BitSpan | null>(null)

  const sourceBase = rows.find((base) => base.key === sourceKey) ?? rows[0]
  const parsed = parseDigits(sourceDigits, sourceBase.radix)
  const { error, message, value } = describe(parsed, sourceBase, rejection)

  // Each row uses only the places that fit within the 16-bit limit, with leading
  // zeros in those places. An empty source renders blank; zero stays visible.
  const displayed = rows.map((base) => {
    const isSource = base.key === sourceKey
    const digits = isSource ? Array.from(sourceDigits) : value === null ? [] : digitsForValue(value, base.radix)
    const hasValue = isSource ? sourceDigits.length > 0 : value !== null
    const places = positionsForBase(base.radix)
    return {
      base,
      boxes: hasValue ? padToPositions(digits, places) : Array.from({ length: places }, () => ''),
    }
  })

  // Every digit box registers itself here by base and place, so the editable
  // surface can put the caret back without hunting through the DOM.
  const cellsRef = useRef(new Map<string, HTMLInputElement>())
  const breakdownTogglesRef = useRef(new Map<string, HTMLButtonElement>())
  const unitsKey = (base: Base) => `${base.key}:${positionsForBase(base.radix) - 1}`
  const focusRowControl = (event: KeyboardEvent, base: Base, direction: -1 | 1) => {
    const rowIndex = rows.findIndex((row) => row.key === base.key)
    const targetRow = rows[rowIndex + direction]
    if (!targetRow) return

    event.preventDefault()
    if (direction === 1) cellsRef.current.get(unitsKey(targetRow))?.focus()
    else breakdownTogglesRef.current.get(targetRow.key)?.focus()
  }
  const focusToggleFromUnits = (event: KeyboardEvent<HTMLInputElement>, base: Base) => {
    if (event.shiftKey) {
      focusRowControl(event, base, -1)
      return
    }

    event.preventDefault()
    breakdownTogglesRef.current.get(base.key)?.focus()
  }
  const focusUnitsFromToggle = (event: KeyboardEvent<HTMLButtonElement>, base: Base, breakdownOpen: boolean) => {
    if (event.shiftKey) {
      event.preventDefault()
      cellsRef.current.get(unitsKey(base))?.focus()
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
  const focusUnitsFromBreakdownTerm = (event: KeyboardEvent<HTMLSpanElement>, base: Base, isFirst: boolean, isLast: boolean) => {
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

  // Focus the units place on the active row. Every other box is a read-only readout
  // that never takes the caret — not by mouse, not by Tab, not by typing — so each
  // row still exposes exactly one editable stop.
  const focusEditable = () => {
    cellsRef.current.get(unitsKey(sourceBase))?.focus()
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
    // Aiming at a control is a deliberate choice and wins, so the links stay usable.
    // A read-only digit box is part of the readout; clicking it should return focus
    // to the editable units box without making breakdown terms lose their focus behavior.
    const aimedAtAControl = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false
      const digitBox = target.closest('input[data-digit]')
      if (digitBox) return digitBox.hasAttribute('data-editable')
      return target.closest('input, button, select, textarea, label, a[href], [data-breakdown-term]') !== null
    }
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
  // Only the units box is writable, so an edit always appends a newest digit to the
  // active value rather than replacing the place the caret happens to sit in.
  const editDigit = (base: Base, boxes: string[], raw: string) => {
    if (raw.length === 0) return

    const char = pickTypedChar(raw, boxes[boxes.length - 1])
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
  }

  const onCellKeyDown = (event: KeyboardEvent<HTMLInputElement>, base: Base, boxes: string[]) => {
    const digit = digitValue(event.key)
    if (!event.ctrlKey && !event.metaKey && !event.altKey && digit >= 0 && digit < base.radix) {
      event.preventDefault()
      editDigit(base, boxes, event.key)
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
      <PageHeader />

      <section aria-labelledby="page-title">
        <h1 className="mt-5 text-[clamp(22px,3.4vw,28px)] font-bold leading-tight tracking-[-0.6px]" id="page-title">
          One number, any base
        </h1>
        <p className="mt-2 max-w-[54ch] text-[13px] leading-relaxed text-[#63728a]">
          Type into a row's units box. That row becomes the base you are writing in, and every other row rewrites itself as you go.
        </p>

        <div className="mt-8">
          <h2 className="m-0 text-xs font-semibold text-[#63728a]" id="result-title">The same value, written out</h2>
          <p className="mt-1.5 max-w-[60ch] text-xs leading-relaxed text-[#8190a5]">
            Each position is numbered from zero on the right and labeled under its box. Open the breakdown below to see how each non-zero digit contributes to the same total.
          </p>
          <HelpDetails />

          <ConversionTable
            displayed={displayed}
            value={value}
            highlightedBits={hoveredBits ?? focusedBits}
            onHoverPosition={(base, position) => setHoveredBits(position === null ? null : bitSpanForDigit(base.radix, position))}
            onFocusPosition={(base, position) => setFocusedBits(position === null ? null : bitSpanForDigit(base.radix, position))}
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

          <StatusLine isError={error !== ''}>{message}</StatusLine>
        </div>

        <p className="mt-10 border-t border-[#e7edf5] pt-5 text-xs leading-relaxed text-[#63728a]">
          The number itself never changes — only the symbols that hold it. Each row shows all of its available places, and octal and hexadecimal show which bits combine to make each digit.
        </p>
      </section>
    </main>
  )
}

export default App
