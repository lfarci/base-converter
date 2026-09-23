import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'

const MIN_RADIX = 2
const MAX_RADIX = 36
const DIGIT_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const SAFE_LIMIT = BigInt(Number.MAX_SAFE_INTEGER)

type Base = {
  key: string
  name: string
  radix: number
  accent: string
  fixed: boolean
}

const fixedBases: Base[] = [
  { key: 'decimal', name: 'Decimal', radix: 10, accent: '#e8aa42', fixed: true },
  { key: 'binary', name: 'Binary', radix: 2, accent: '#4381e6', fixed: true },
  { key: 'octal', name: 'Octal', radix: 8, accent: '#37a88d', fixed: true },
  { key: 'hexadecimal', name: 'Hexadecimal', radix: 16, accent: '#9170d7', fixed: true },
]

const addedAccents = ['#d4756b', '#4d9ecf', '#8f9f3d', '#c07ac0', '#4fb3a1', '#b1813f']

function makeBase(radix: number, index: number): Base {
  return {
    key: `base-${radix}`,
    name: `Base ${radix}`,
    radix,
    accent: addedAccents[index % addedAccents.length],
    fixed: false,
  }
}

function digitRange(radix: number) {
  return radix <= 10 ? `0–${radix - 1}` : `0–9 and A–${DIGIT_ALPHABET[radix - 1]}`
}

function digitValue(char: string) {
  return DIGIT_ALPHABET.indexOf(char.toUpperCase())
}

// Register widths the rows can pad to. 'auto' keeps the natural, unpadded length.
const WIDTH_OPTIONS = ['auto', 32, 64] as const
type WidthChoice = (typeof WIDTH_OPTIONS)[number]
type DigitWidth = Exclude<WidthChoice, 'auto'>

function widthLabel(width: WidthChoice) {
  return width === 'auto' ? 'Auto' : `${width}-bit`
}

// Largest value a register of this width can hold: 2^width - 1.
function widthLimit(width: DigitWidth) {
  return 2n ** BigInt(width) - 1n
}

// One wording per width choice, so the range guard and the render path agree.
function limitMessage(width: WidthChoice) {
  return width === 'auto'
    ? 'That number is too large to convert accurately. Try a smaller whole number.'
    : `That number is too large for a ${width}-bit width. A ${width}-bit word holds at most ${widthLimit(width).toString(10)}.`
}

// PageUp/PageDown step by one place: ten in bases up to 10, sixteen above.
function pageStep(radix: number) {
  return radix <= 10 ? 10n : 16n
}

// Positions a width occupies in a radix, derived from the radix itself (count
// the digits of the largest value it can hold) so the two can never drift apart.
function positionsForWidth(width: DigitWidth, radix: number) {
  return widthLimit(width).toString(radix).length
}

// Leading-zero padding: boxes past the most significant digit render as 0.
// An over-long value is left alone; the range check reports it instead.
function padDigits(digits: string[], positions: number) {
  if (digits.length === 0 || digits.length >= positions) return digits
  return [...Array<string>(positions - digits.length).fill('0'), ...digits]
}

// Numeric-model seam: the view reads and writes numbers only through
// parseDigits and digitsForValue, so a later layer can swap BigInt for a
// fixed-width or padded model without rewriting the component.
type ParsedDigits =
  | { status: 'empty' }
  | { status: 'invalid'; char: string }
  | { status: 'too-large'; value: bigint }
  | { status: 'ok'; value: bigint }

// `limit` is the largest value the caller accepts: the safe-integer ceiling in
// Auto mode, or 2^width - 1 when a fixed register width is selected.
function parseDigits(text: string, radix: number, limit: bigint = SAFE_LIMIT): ParsedDigits {
  if (text.length === 0) return { status: 'empty' }

  let value = 0n
  const scale = BigInt(radix)

  for (const char of text.toUpperCase()) {
    const digit = digitValue(char)
    if (digit < 0 || digit >= radix) return { status: 'invalid', char }
    value = value * scale + BigInt(digit)
  }

  return value > limit ? { status: 'too-large', value } : { status: 'ok', value }
}

function digitsForValue(value: bigint, radix: number) {
  return Array.from(value.toString(radix).toUpperCase())
}

function pickTypedChar(raw: string, previous: string) {
  const text = raw.toUpperCase()
  if (text.length <= 1) return text
  return Array.from(text).find((char) => char !== previous.toUpperCase()) ?? text.slice(-1)
}

function App() {
  const [rows, setRows] = useState<Base[]>(fixedBases)
  const [sourceKey, setSourceKey] = useState('decimal')
  const [sourceDigits, setSourceDigits] = useState('42')
  const [width, setWidth] = useState<WidthChoice>('auto')
  const [rejection, setRejection] = useState('')
  const [pendingRadix, setPendingRadix] = useState('')
  const [baseError, setBaseError] = useState('')

  const sourceBase = rows.find((base) => base.key === sourceKey) ?? fixedBases[0]
  const limit = width === 'auto' ? SAFE_LIMIT : widthLimit(width)
  const parsed = parseDigits(sourceDigits, sourceBase.radix, limit)
  const value = parsed.status === 'ok' ? parsed.value : null
  const error = rejection
    || (parsed.status === 'too-large' ? limitMessage(width) : '')
    || (parsed.status === 'invalid' ? `Enter digits ${digitRange(sourceBase.radix)} for base ${sourceBase.radix}.` : '')
  const help = parsed.status === 'empty'
      ? 'Nothing typed yet — ↑ starts at 1, ↓ stays at 0.'
      : `Reading base ${sourceBase.radix}, digits ${digitRange(sourceBase.radix)}. Type in another row to write in that base instead, or use the −/+ buttons to step the value by one.`

  const displayed = rows.map((base) => {
    const isSource = base.key === sourceKey
    const digits = isSource
      ? Array.from(sourceDigits)
      : value === null ? null : digitsForValue(value, base.radix)
    const padded = width === 'auto' || digits === null ? digits : padDigits(digits, positionsForWidth(width, base.radix))
    return { base, isSource, boxes: padded === null ? null : padded.length > 0 ? padded : [''] }
  })
  const digitCounts = displayed.map(({ boxes }) => boxes?.length ?? 0).join('-')
  const scrollerRef = useRef<HTMLDivElement>(null)

  // Every digit box registers itself here by base and place, so the editable
  // surface can put the caret back without hunting through the DOM.
  const cellsRef = useRef(new Map<string, HTMLInputElement>())
  // Rendering can add or drop a place, so the caret is restored after the commit
  // rather than from inside the event that caused it. The initial 'first' is what
  // makes typing work with no click.
  const pendingFocusRef = useRef<'first' | 'last' | null>('first')
  const caretIsInSurface = (node: Element | null = document.activeElement) =>
    node instanceof HTMLInputElement && node.dataset.digit === 'true'

  // The source row is the editable surface. Its boxes always render — even when the
  // value is out of range — so there is always somewhere to put the caret.
  const focusEditable = (where: 'first' | 'last' = 'first') => {
    const places = Math.max(Array.from(sourceDigits).length, 1)
    cellsRef.current.get(`${sourceBase.key}:${where === 'last' ? places - 1 : 0}`)?.focus()
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
    // A commit can take a place away (a step down, or typing into a padded row that
    // then becomes the unpadded source) and drop the caret onto the page. Only that
    // lost case is recovered: a control the reader aimed at keeps the focus.
    if (document.activeElement === null || document.activeElement === document.body) {
      focusEditableRef.current('last')
    }
  })

  useEffect(() => {
    const scroller = scrollerRef.current
    if (scroller) scroller.scrollLeft = scroller.scrollWidth
  }, [digitCounts, sourceKey])

  // Focus policy: aiming at a control is a deliberate choice and wins, so the width
  // radios, the base-add field and the remove buttons stay usable. Anything else — a
  // release on plain content, a stray keypress, coming back to the tab — hands the
  // caret back so the next digit lands in the number. The page's own actions
  // (stepping, adding a base) ask for the caret themselves once they have finished.
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
    if (target > limit) {
      setRejection(limitMessage(width))
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
    // Layer 4: this array stays flat and most-significant-first; grouping is a
    // render-time concern.
    const next = boxes.slice()

    if (raw.length === 0) {
      next.splice(index, 1)
    } else {
      const char = pickTypedChar(raw, boxes[index])
      const digit = digitValue(char)
      if (digit < 0 || digit >= base.radix) {
        setRejection(`Enter digits ${digitRange(base.radix)} for base ${base.radix}.`)
        return
      }
      next[index] = char
    }

    setRejection('')
    setSourceKey(base.key)
    // The source row stays its natural length so its boxes do not move under the
    // caret while typing; padding is a property of the derived rows only.
    setSourceDigits(next.join(''))
  }

  const removeBase = (base: Base) => {
    setRows((current) => current.filter((row) => row.key !== base.key))
    if (base.key === sourceKey) {
      setSourceKey(fixedBases[0].key)
      setSourceDigits(parsed.status === 'ok' || parsed.status === 'too-large' ? parsed.value.toString(10) : '')
      setRejection('')
    }
  }

  const pendingValue = Number(pendingRadix)
  const pendingIsValid = Number.isInteger(pendingValue) && pendingValue >= MIN_RADIX && pendingValue <= MAX_RADIX
  const pendingTaken = pendingIsValid && rows.some((base) => base.radix === pendingValue)
  const baseHelp = pendingIsValid && !pendingTaken
    ? `Base ${pendingValue} uses digits ${digitRange(pendingValue)}.`
    : `Any whole number from ${MIN_RADIX} to ${MAX_RADIX}. Digits above 9 use A–Z.`

  const addBase = (event: FormEvent) => {
    event.preventDefault()
    if (!pendingIsValid) {
      setBaseError(`Enter a whole number from ${MIN_RADIX} to ${MAX_RADIX}.`)
      return
    }
    if (pendingTaken) {
      setBaseError(`Base ${pendingValue} already has a row.`)
      return
    }
    setRows((current) => [...current, makeBase(pendingValue, current.length)])
    setBaseError('')
    setPendingRadix('')
    // The row was added; the next keystroke should land in the number, not in the field
    // that is now empty. A rejected add leaves the caret where the correction is needed.
    pendingFocusRef.current = 'last'
  }

  return (
    <main className="mx-auto w-full max-w-[760px] px-4 pb-16 text-[#172b4d] sm:px-6" id="top">
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
            Once the caret is in a box, ↑ and ↓ step the number by one and Page Up / Page Down step it by a whole place.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-[11px] font-semibold text-[#63728a]" id="digit-width-title">Digit width</span>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="digit-width-title" aria-describedby="digit-width-help">
              {WIDTH_OPTIONS.map((option) => {
                const isSelected = option === width
                return (
                  <label className={`flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 font-mono text-xs font-medium transition ${isSelected ? 'border-[#2458d3] bg-[#f0f4ff] text-[#172b4d]' : 'border-[#e3e9f1] text-[#344761] hover:border-[#a9bad2]'} has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#2458d3]`} key={option}>
                    <input
                      className="sr-only"
                      type="radio"
                      name="digit-width"
                      value={option}
                      checked={isSelected}
                      onChange={() => setWidth(option)}
                      // A pointer pick is finished business, so the caret comes back to the
                      // number. A keyboard pick (detail === 0) is left alone, which keeps
                      // arrow-key travel across the radios working.
                      onClick={(event) => {
                        if (event.detail > 0) pendingFocusRef.current = 'last'
                      }}
                    />
                    {widthLabel(option)}
                  </label>
                )
              })}
            </div>
            <p className="m-0 text-xs text-[#8190a5]" id="digit-width-help">
              {width === 'auto'
                ? 'Rows show only the positions the value needs.'
                : `Every row pads to the positions a ${width}-bit word needs.`}
            </p>
          </div>

          <div className="mt-4 overflow-x-auto" ref={scrollerRef}>
            <table className="w-full border-separate border-spacing-0 text-left" aria-labelledby="result-title">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-[132px] border-b border-[#e3e9f1] bg-white pb-2 text-[10px] font-bold uppercase tracking-[0.9px] text-[#8190a5]" scope="col">Base</th>
                <th className="border-b border-[#e3e9f1] pb-2 pl-3 text-[10px] font-bold uppercase tracking-[0.9px] text-[#8190a5]" scope="col">Written out</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(({ base, isSource, boxes }) => (
                <tr className={isSource ? 'bg-[#f7f9fc]' : 'bg-white'} key={base.key}>
                  <th className="sticky left-0 z-10 border-b border-[#eef2f8] bg-inherit py-3 pr-3 align-middle font-normal" scope="row">
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: base.accent }} aria-hidden="true" />
                      <span className="text-[13px] font-bold text-[#172b4d]">{base.name}</span>
                      <span className="font-mono text-[11px] text-[#8190a5]">{base.radix}</span>
                      {isSource && (
                        <span className="rounded-full border border-[#2458d3]/30 bg-[#f0f4ff] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.6px] text-[#2458d3]">source</span>
                      )}
                      {!base.fixed && (
                        <button
                          className="ml-1 grid size-5 shrink-0 place-items-center rounded-full border border-[#e3e9f1] text-[13px] leading-none text-[#63728a] transition hover:border-[#bd3b46] hover:text-[#bd3b46]"
                          type="button"
                          onClick={() => removeBase(base)}
                          aria-label={`Remove the base ${base.radix} row`}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  </th>
                  <td className="border-b border-[#eef2f8] py-3 pl-3 align-middle">
                    {boxes ? (
                      <div className="flex items-end justify-end gap-2">
                      {isSource && (
                        <span className="mb-6 flex shrink-0 items-center gap-1" role="group" aria-label={`Step the ${base.name} value`}>
                          <button
                            className="grid size-7 shrink-0 place-items-center rounded-md border border-[#dbe3ee] bg-white font-mono text-sm font-bold leading-none text-[#344761] transition hover:border-[#2458d3] hover:text-[#2458d3]"
                            type="button"
                            aria-label={`Decrease the ${base.name} value by one`}
                            title="Step down by one (ArrowDown)"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => stepFromControl(-1n)}
                          >
                            {'\u2212'}
                          </button>
                          <button
                            className="grid size-7 shrink-0 place-items-center rounded-md border border-[#dbe3ee] bg-white font-mono text-sm font-bold leading-none text-[#344761] transition hover:border-[#2458d3] hover:text-[#2458d3]"
                            type="button"
                            aria-label={`Increase the ${base.name} value by one`}
                            title="Step up by one (ArrowUp)"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => stepFromControl(1n)}
                          >
                            +
                          </button>
                        </span>
                      )}
                      <ol className="m-0 flex list-none justify-end gap-px p-0" aria-label={`${base.name} digits, most significant first`}>
                        {boxes.map((digit, index) => {
                          const position = boxes.length - 1 - index
                          const cellKey = `${base.key}:${index}`
                          return (
                            <li className="m-0 flex flex-col items-center" key={cellKey}>
                              <input
                                className={`size-[clamp(18px,4.4vw,30px)] shrink-0 rounded-[4px] border bg-white p-0 text-center font-mono text-[clamp(12px,2.9vw,17px)] font-semibold leading-none tabular-nums text-[#172b4d] outline-none transition focus:border-[#2458d3] focus:ring-2 focus:ring-[#2458d3]/25 ${isSource ? '' : 'border-[#dbe3ee] hover:border-[#a9bad2]'}`}
                                style={isSource ? { borderColor: base.accent } : undefined}
                                type="text"
                                data-digit="true"
                                ref={(node) => {
                                  if (node) cellsRef.current.set(cellKey, node)
                                  else cellsRef.current.delete(cellKey)
                                }}
                                inputMode={base.radix <= 10 ? 'numeric' : 'text'}
                                autoComplete="off"
                                spellCheck={false}
                                value={digit}
                                onFocus={(event) => event.target.select()}
                                onKeyDown={onCellKeyDown}
                                onChange={(event) => editDigit(base, boxes, index, event.target.value)}
                                aria-label={`${base.name} (base ${base.radix}) digit at position ${position}${isSource ? ', source base' : ''}`}
                              />
                              <span className="size-[clamp(18px,4.4vw,30px)] shrink-0 pt-1 text-center font-mono text-[9px] leading-none text-[#a3b0c2]" aria-hidden="true">
                                {position}
                              </span>
                            </li>
                          )
                        })}
                      </ol>
                      </div>
                    ) : (
                      <span className="block text-right font-mono text-xl text-[#a3b0c2]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <p className={`mt-3 min-h-5 text-xs leading-relaxed ${error ? 'text-[#a52736]' : 'text-[#63728a]'}`} id="edit-status" role={error ? 'alert' : 'status'}>
            {error || help}
          </p>
        </div>

        <div className="mt-10">
          <h2 className="m-0 text-xs font-semibold text-[#63728a]" id="add-base-title">Add another base</h2>
          <form className="mt-3 flex flex-wrap items-end gap-3" aria-labelledby="add-base-title" onSubmit={addBase} noValidate>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#63728a]" htmlFor="new-base-radix">Base to add (2–36)</label>
              <input
                className={`min-h-11 w-[132px] rounded-lg border bg-white px-3 font-mono text-sm font-semibold text-[#172b4d] outline-none transition focus:border-[#2458d3] focus:ring-[3px] focus:ring-[#2458d3]/15 ${baseError ? 'border-[#bd3b46]' : 'border-[#cdd7e5]'}`}
                id="new-base-radix"
                type="number"
                min={MIN_RADIX}
                max={MAX_RADIX}
                step={1}
                inputMode="numeric"
                autoComplete="off"
                value={pendingRadix}
                onChange={(event) => setPendingRadix(event.target.value)}
                aria-describedby="add-base-status"
                aria-invalid={Boolean(baseError)}
              />
            </div>
            <button className="min-h-11 rounded-lg border border-[#2458d3] bg-[#2458d3] px-4 text-xs font-semibold text-white transition hover:border-[#1d47ab] hover:bg-[#1d47ab]" type="submit">
              Add base
            </button>
          </form>
          <p className={`mt-2 min-h-5 text-xs leading-relaxed ${baseError ? 'text-[#a52736]' : 'text-[#63728a]'}`} id="add-base-status" role={baseError ? 'alert' : undefined}>
            {baseError || baseHelp}
          </p>
        </div>

        <p className="mt-10 border-t border-[#e7edf5] pt-5 text-xs leading-relaxed text-[#63728a]">
          The number itself never changes — only the symbols that hold it, and how many places they need.
        </p>
      </section>
    </main>
  )
}

export default App