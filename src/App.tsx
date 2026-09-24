import { type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { DigitRow } from './DigitRow'
import {
  bitsPerDigit,
  digitRange,
  digitValue,
  digitsForValue,
  groupBits,
  LIMIT_MESSAGE,
  pageStep,
  padToPositions,
  parseDigits,
  pickTypedChar,
  POSITIONS,
  rows,
  VALUE_LIMIT,
  type Base,
} from './conversion'

function App() {
  const [sourceKey, setSourceKey] = useState('decimal')
  const [sourceDigits, setSourceDigits] = useState('42')
  const [rejection, setRejection] = useState('')

  const sourceBase = rows.find((base) => base.key === sourceKey) ?? rows[0]
  const parsed = parseDigits(sourceDigits, sourceBase.radix)
  const value = parsed.status === 'ok' ? parsed.value : null
  const error = rejection
    || (parsed.status === 'too-large' ? LIMIT_MESSAGE : '')
    || (parsed.status === 'invalid' ? `Enter digits ${digitRange(sourceBase.radix)} for base ${sourceBase.radix}.` : '')
  const help = parsed.status === 'empty'
      ? 'Nothing typed yet — ↑ starts at 1, ↓ stays at 0.'
      : `Reading base ${sourceBase.radix}, digits ${digitRange(sourceBase.radix)}. Type in another row to write in that base instead, or use the −/+ buttons to step the value by one.`

  // Every row is the same fixed grid of POSITIONS places: the value's digits sit in
  // the low places with leading zeros above them. A row with no value at all renders
  // the grid empty rather than a dash or a field of zeros, so the columns keep their
  // shape without claiming the value is zero.
  const displayed = rows.map((base) => {
    const isSource = base.key === sourceKey
    const digits = isSource ? Array.from(sourceDigits) : value === null ? [] : digitsForValue(value, base.radix)
    const hasValue = isSource ? sourceDigits.length > 0 : value !== null
    return {
      base,
      isSource,
      boxes: hasValue ? padToPositions(digits) : Array.from({ length: POSITIONS }, () => ''),
    }
  })

  // Underboxes: each paired base draws its own grouping, derived from the binary
  // row's own places, so 3-bit groups sit in the octal row and 4-bit groups in the
  // hex row. The binary row is a full POSITIONS places, so at rest that is six octal
  // groups (the leading one short) and four hex groups. Removing a paired row removes
  // its grouping, and an empty or rejected entry groups nothing.
  const binaryBits = (displayed.find((row) => row.base.radix === 2)?.boxes ?? []).filter((digit) => digit.length > 0)
  const withGroupings = displayed.map((row) => {
    const size = bitsPerDigit(row.base.radix)
    const grouping = size === null || value === null || binaryBits.length === 0
      ? null
      : { base: row.base, size, groups: groupBits(binaryBits, size, row.base.radix) }
    return { ...row, grouping }
  })

  // Every digit box registers itself here by base and place, so the editable
  // surface can put the caret back without hunting through the DOM.
  const cellsRef = useRef(new Map<string, HTMLInputElement>())
  // Restore focus after commits rather than inside the event that caused them. The
  // initial 'first' target makes typing work with no click.
  const pendingFocusRef = useRef<'first' | 'last' | null>('first')
  const caretIsInSurface = (node: Element | null = document.activeElement) =>
    node instanceof HTMLInputElement && node.dataset.digit === 'true'

  // The source row is the editable surface, and now that every row is padded it is a
  // fixed POSITIONS grid too — the places never move, so the caret can stay where it
  // is put. 'first' aims at the leading digit rather than the top of the grid, so
  // typing on load writes into the number instead of filling the empty high places.
  const focusEditable = (where: 'first' | 'last' = 'first') => {
    const places = Math.min(Array.from(sourceDigits).length, POSITIONS)
    const index = where === 'last'
      ? POSITIONS - 1
      : Math.min(Math.max(POSITIONS - places, 0), POSITIONS - 1)
    cellsRef.current.get(`${sourceBase.key}:${index}`)?.focus()
  }

  const focusEditableRef = useRef(focusEditable)
  useEffect(() => {
    focusEditableRef.current = focusEditable
  })

  useEffect(() => {
    const where = pendingFocusRef.current
    pendingFocusRef.current = null
    if (where) {
      focusEditableRef.current(where)
      return
    }
    // A commit can take a place away (a step down, or typing into a derived row that
    // then becomes the source) and drop the caret onto the page. Only that lost case
    // is recovered: a control the reader aimed at keeps the focus.
    if (document.activeElement === null || document.activeElement === document.body) {
      focusEditableRef.current('last')
    }
  })


  // Focus policy: aiming at a control is a deliberate choice and wins, so the links
  // stay usable. Anything else — a release on plain content, a stray keypress, coming
  // back to the tab — hands the caret back so the next digit lands in the number. The
  // page's own actions (stepping) ask for the caret themselves once they have finished.
  useEffect(() => {
    const aimedAtAControl = (target: EventTarget | null) =>
      target instanceof Element && target.closest('input, button, select, textarea, label, a[href]') !== null
    const isOtherTextEntry = (node: Element | null) =>
      node instanceof HTMLTextAreaElement
      || (node instanceof HTMLInputElement
        && ['text', 'number', 'search', 'tel', 'url', 'email', 'password'].includes(node.type))

    const returnToSurface = (event: Event) => {
      if (aimedAtAControl(event.target) || caretIsInSurface()) return
      focusEditableRef.current('first')
    }
    // Coming back to the tab lands in the field again, unless the caret was left in
    // another text field on purpose.
    const onWindowFocus = () => {
      if (isOtherTextEntry(document.activeElement)) return
      focusEditableRef.current('first')
    }

    document.addEventListener('pointerup', returnToSurface)
    document.addEventListener('keydown', returnToSurface)
    document.addEventListener('visibilitychange', onWindowFocus)
    window.addEventListener('focus', onWindowFocus)
    return () => {
      document.removeEventListener('pointerup', returnToSurface)
      document.removeEventListener('keydown', returnToSurface)
      document.removeEventListener('visibilitychange', onWindowFocus)
      window.removeEventListener('focus', onWindowFocus)
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
      return
    }
    if (target > VALUE_LIMIT) {
      setRejection(LIMIT_MESSAGE)
      return
    }
    setRejection('')
    setSourceDigits(target.toString(sourceBase.radix))
  }

  const stepFromControl = (delta: bigint) => {
    stepValue(delta)
    pendingFocusRef.current = 'last'
  }

  // Arrow keys step by one; Page Up/Down step by a whole place — ten in the bases we
  // read as tens and units, sixteen from base 11 up where a place is a nibble wider.
  const onCellKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const up = event.key === 'ArrowUp' || event.key === 'PageUp'
    const down = event.key === 'ArrowDown' || event.key === 'PageDown'
    if (!up && !down) return
    event.preventDefault()
    const magnitude = event.key === 'PageUp' || event.key === 'PageDown' ? pageStep(sourceBase.radix) : 1n
    stepValue(up ? magnitude : -magnitude)
  }

  const editDigit = (base: Base, boxes: string[], index: number, raw: string) => {
    // Keep editing in the flat, most-significant-first digit array; grouping is a
    // render-time concern. The grid has fixed places, so editing writes into one place instead of
    // adding or removing one: clearing a box blanks that place to zero rather than
    // shortening the number, which is what keeps the places (and the caret) still.
    const next = boxes.slice()
    const char = raw.length === 0 ? '0' : pickTypedChar(raw, boxes[index])
    const digit = digitValue(char)
    if (digit < 0 || digit >= base.radix) {
      setRejection(`Enter digits ${digitRange(base.radix)} for base ${base.radix}.`)
      return
    }
    next[index] = char

    // Re-read the grid as a whole so the value keeps its one ceiling and the leading
    // zeros the grid is showing never reach the number itself.
    const typed = parseDigits(next.join(''), base.radix)
    if (typed.status === 'too-large') {
      setRejection(LIMIT_MESSAGE)
      return
    }

    setRejection('')
    setSourceKey(base.key)
    setSourceDigits(typed.status === 'ok' ? digitsForValue(typed.value, base.radix).join('') : '')
  }

  return (
    <main className="mx-auto w-full px-4 pb-16 text-[#172b4d] sm:px-6 lg:max-w-[920px]" id="top">
      <header className="flex items-baseline justify-between py-6 sm:py-8">
        <a className="text-[15px] font-bold tracking-tight text-[#172b4d] no-underline" href="#top">basewise</a>
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
          <p className="mt-1.5 text-xs text-[#8190a5]">
            Each box holds one position; the digit under a box is that position's index, so the rightmost box is always the units digit.
            The sixteen digit boxes stretch across the available row width; leading zeros fill positions the value does not use. On narrow screens, scroll horizontally to keep each box readable.
            Once the caret is in a box, ↑ and ↓ step the number by one and Page Up / Page Down step it by a whole place.
          </p>

          <div className="mt-4 overflow-x-auto" role="region" aria-label="Scrollable base conversion table" tabIndex={0}>
            <table className="w-full min-w-[720px] table-fixed border-separate border-spacing-0 text-left" aria-labelledby="result-title">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-[104px] border-b border-[#e3e9f1] bg-white pb-2 text-[10px] font-bold uppercase tracking-[0.9px] text-[#8190a5]" scope="col">Base</th>
                  <th className="border-b border-[#e3e9f1] pb-2 pl-3 text-[10px] font-bold uppercase tracking-[0.9px] text-[#8190a5]" scope="col">Written out</th>
                </tr>
              </thead>
              <tbody>
                {withGroupings.map(({ base, isSource, boxes, grouping }) => (
                  <DigitRow
                    key={base.key}
                    base={base}
                    boxes={boxes}
                    isSource={isSource}
                    grouping={grouping}
                    onDigitKeyDown={onCellKeyDown}
                    onEditDigit={editDigit}
                    registerCell={(cellKey) => (node) => {
                      if (node) cellsRef.current.set(cellKey, node)
                      else cellsRef.current.delete(cellKey)
                    }}
                    onStep={stepFromControl}
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
          The number itself never changes — only the symbols that hold it. Every row shows the same sixteen positions, and the value sits in the low ones.
        </p>
      </section>
    </main>
  )
}

export default App