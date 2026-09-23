import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'

const MIN_RADIX = 2
const MAX_RADIX = 36
const DIGIT_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const SAFE_LIMIT = BigInt(Number.MAX_SAFE_INTEGER)

// Digit geometry is one fixed pixel size, never a viewport-relative clamp: a row's
// boxes must be the same size on a phone as on a wide desktop, because the width
// that matters is the card's, not the window's. These are the maxima the previous
// clamps resolved to at >=1280px, so wide-viewport appearance is unchanged.
const BOX_SIZE = '30px'
const BOX_TEXT = '17px'
const GROUP_SLOT_W = '30px'
const GROUP_SLOT_H = '21px'

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

// The one accuracy ceiling the page reports. Rows always show exactly the
// positions the value needs, so there is no width-specific wording to choose.
const LIMIT_MESSAGE = 'That number is too large to convert accurately. Try a smaller whole number.'

// PageUp/PageDown step by one place: ten in bases up to 10, sixteen above.
function pageStep(radix: number) {
  return radix <= 10 ? 10n : 16n
}

// Numeric-model seam: the view reads and writes numbers only through
// parseDigits and digitsForValue, so a later layer can swap BigInt for a
// fixed-width or padded model without rewriting the component.
type ParsedDigits =
  | { status: 'empty' }
  | { status: 'invalid'; char: string }
  | { status: 'too-large'; value: bigint }
  | { status: 'ok'; value: bigint }

// `limit` is the largest value the caller accepts; the component uses the
// safe-integer ceiling, and the parameter is the seam a wider model would use.
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

// One octal digit holds three bits and a hex digit four, which is the whole point
// of the underboxes. Those two pairings are the ones the page ships with; any
// other added base is left without grouping.
function bitsPerDigit(radix: number) {
  if (radix === 8) return 3
  if (radix === 16) return 4
  return null
}

type BitGroup = {
  bits: string[]
  placeholders: number
  label: string
}

type BitGrouping = {
  base: Base
  size: number
  groups: BitGroup[]
}

// Grouping counts from the right, so the leading group can be short. The bits
// themselves are never rewritten: the positions that group is missing become
// decorative placeholders on its left instead of zeros in the value.
function groupBits(bits: string[], size: number, radix: number): BitGroup[] {
  const groups: BitGroup[] = []

  for (let end = bits.length; end > 0; end -= size) {
    const chunk = bits.slice(Math.max(0, end - size), end)
    const parsed = parseDigits(chunk.join(''), 2)
    groups.unshift({
      bits: chunk,
      placeholders: size - chunk.length,
      label: (parsed.status === 'ok' ? parsed.value : 0n).toString(radix).toUpperCase(),
    })
  }

  return groups
}

// Decorative underbox for one paired row: it draws the binary digits the way that
// base reads them, with the paired digit beneath each group. It renders inside the
// paired row itself (octal under octal, hex under hex) and is derived from the
// binary row's places. Hidden from assistive tech — the digit rows are the
// accessible value, and nothing here is focusable or editable.
function GroupingUnderbox({ grouping }: { grouping: BitGrouping | null }) {
  if (grouping === null) return null

  const { base, size, groups } = grouping

  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <span className="whitespace-nowrap font-mono text-[9px] font-semibold uppercase tracking-[0.5px]" style={{ color: base.accent }}>
        {`${base.name.toLowerCase()} · ${size} bits`}
      </span>
      <ol className="m-0 flex list-none gap-px p-0">
        {groups.map((group, index) => (
          <li className="flex shrink-0 flex-col items-center gap-px rounded-[5px]" key={index} style={{ backgroundColor: `${base.accent}1f` }}>
            <span className="flex gap-px">
              {Array.from({ length: group.placeholders }, (_, slot) => (
                <span className="shrink-0 rounded-[3px] border border-dashed border-[#c9d4e3]" style={{ width: GROUP_SLOT_W, height: GROUP_SLOT_H }} key={`missing-${slot}`} />
              ))}
              {group.bits.map((_, slot) => (
                <span className="shrink-0 rounded-[3px] border" style={{ width: GROUP_SLOT_W, height: GROUP_SLOT_H, borderColor: base.accent }} key={slot} />
              ))}
            </span>
            <span className="w-full text-center font-mono text-[9px] font-bold leading-none" style={{ color: base.accent }}>
              {group.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function App() {
  const [rows, setRows] = useState<Base[]>(fixedBases)
  const [sourceKey, setSourceKey] = useState('decimal')
  const [sourceDigits, setSourceDigits] = useState('42')
  const [rejection, setRejection] = useState('')
  const [pendingRadix, setPendingRadix] = useState('')
  const [baseError, setBaseError] = useState('')

  const sourceBase = rows.find((base) => base.key === sourceKey) ?? fixedBases[0]
  const parsed = parseDigits(sourceDigits, sourceBase.radix)
  const value = parsed.status === 'ok' ? parsed.value : null
  const error = rejection
    || (parsed.status === 'too-large' ? LIMIT_MESSAGE : '')
    || (parsed.status === 'invalid' ? `Enter digits ${digitRange(sourceBase.radix)} for base ${sourceBase.radix}.` : '')
  const help = parsed.status === 'empty'
      ? 'Nothing typed yet — ↑ starts at 1, ↓ stays at 0.'
      : `Reading base ${sourceBase.radix}, digits ${digitRange(sourceBase.radix)}. Type in another row to write in that base instead, or use the −/+ buttons to step the value by one.`

  const displayed = rows.map((base) => {
    const isSource = base.key === sourceKey
    const digits = isSource
      ? Array.from(sourceDigits)
      : value === null ? null : digitsForValue(value, base.radix)
    return { base, isSource, boxes: digits === null ? null : digits.length > 0 ? digits : [''] }
  })

  // Underboxes: each paired base draws its own grouping, derived from the binary
  // row's own places, so 3-bit groups sit in the octal row and 4-bit groups in the
  // hex row. Removing a paired row removes its grouping, and an empty or rejected
  // entry groups nothing.
  const binaryBits = (displayed.find((row) => row.base.radix === 2)?.boxes ?? []).filter((digit) => digit.length > 0)
  const withGroupings = displayed.map((row) => {
    const size = bitsPerDigit(row.base.radix)
    const grouping = size === null || value === null || binaryBits.length === 0
      ? null
      : { base: row.base, size, groups: groupBits(binaryBits, size, row.base.radix) }
    return { ...row, grouping }
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
    // A commit can take a place away (a step down, or typing into a derived row that
    // then becomes the source) and drop the caret onto the page. Only that lost case
    // is recovered: a control the reader aimed at keeps the focus.
    if (document.activeElement === null || document.activeElement === document.body) {
      focusEditableRef.current('last')
    }
  })

  useEffect(() => {
    const scroller = scrollerRef.current
    if (scroller) scroller.scrollLeft = scroller.scrollWidth
  }, [digitCounts, sourceKey])

  // Focus policy: aiming at a control is a deliberate choice and wins, so the
  // base-add field, the remove buttons and the links stay usable. Anything else — a
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
    if (target > SAFE_LIMIT) {
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
    // Editing the most significant position grows the row by one; digits typed
    // elsewhere shift the interior of the value instead of changing its length.
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
    <main className="mx-auto w-full px-4 pb-16 text-[#172b4d] sm:px-6" id="top">
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

          <div className="mt-4 overflow-x-auto" ref={scrollerRef}>
            <table className="w-full border-separate border-spacing-0 text-left" aria-labelledby="result-title">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-[132px] border-b border-[#e3e9f1] bg-white pb-2 text-[10px] font-bold uppercase tracking-[0.9px] text-[#8190a5]" scope="col">Base</th>
                <th className="border-b border-[#e3e9f1] pb-2 pl-3 text-[10px] font-bold uppercase tracking-[0.9px] text-[#8190a5]" scope="col">Written out</th>
              </tr>
            </thead>
            <tbody>
              {withGroupings.map(({ base, isSource, boxes, grouping }) => (
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
                      <div className="flex flex-col items-end gap-2">
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
                                className={`shrink-0 rounded-[4px] border bg-white p-0 text-center font-mono font-semibold leading-none tabular-nums text-[#172b4d] outline-none transition focus:border-[#2458d3] focus:ring-2 focus:ring-[#2458d3]/25 ${isSource ? '' : 'border-[#dbe3ee] hover:border-[#a9bad2]'}`}
                                style={{ width: BOX_SIZE, height: BOX_SIZE, fontSize: BOX_TEXT, ...(isSource ? { borderColor: base.accent } : {}) }}
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
                              <span className="shrink-0 pt-1 text-center font-mono text-[9px] leading-none text-[#a3b0c2]" style={{ width: BOX_SIZE }} aria-hidden="true">
                                {position}
                              </span>
                            </li>
                          )
                        })}
                      </ol>
                      </div>
                      <GroupingUnderbox grouping={grouping} />
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