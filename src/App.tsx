import { type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { ConversionTable } from './digits/ConversionTable'
import { HelpDetails } from './layout/HelpDetails'
import { PageHeader } from './layout/PageHeader'
import { StatusLine } from './layout/StatusLine'
import { bitSpanForDigit, parseDigits, type Base, type BitSpan } from './core/conversion'
import { displayedRows, sourceBaseFor, statusFor } from './core/display'
import {
  entryForDeletion,
  entryForDigit,
  entryForStep,
  initialEntryState,
  keyActionFor,
  type EntryState,
  type EntryUpdate,
} from './core/entry'
import { breakdownIdFor, tabFromBreakdownTerm, tabFromToggle, tabFromUnits, unitsCellKey, type FocusTarget } from './core/focus'

function App() {
  const [entry, setEntry] = useState<EntryState>(initialEntryState)
  const [hoveredBits, setHoveredBits] = useState<BitSpan | null>(null)
  const [focusedBits, setFocusedBits] = useState<BitSpan | null>(null)

  const sourceBase = sourceBaseFor(entry.sourceKey)
  const parsed = parseDigits(entry.sourceDigits, sourceBase.radix)
  const { error, message, value } = statusFor(parsed, sourceBase, entry.rejection)
  const displayed = displayedRows(entry.sourceKey, entry.sourceDigits, value)

  // Every digit box registers itself here by base and place, so the editable
  // surface can put the caret back without hunting through the DOM.
  const cellsRef = useRef(new Map<string, HTMLInputElement>())
  const breakdownTogglesRef = useRef(new Map<string, HTMLButtonElement>())
  const pendingFocusRef = useRef<FocusTarget | null>(null)

  const focusTarget = (target: FocusTarget) => {
    if (target.kind === 'cell') cellsRef.current.get(target.cellKey)?.focus()
    else if (target.kind === 'toggle') breakdownTogglesRef.current.get(target.baseKey)?.focus()
    else {
      const breakdown = document.getElementById(target.breakdownId)
      breakdown?.querySelector<HTMLElement>('[data-breakdown-term]')?.focus()
    }
  }

  // Focus the units place on the active row. Every other box is a read-only readout
  // that never takes the caret — not by mouse, not by Tab, not by typing — so each
  // row still exposes exactly one editable stop.
  const focusEditable = () => focusTarget({ kind: 'cell', cellKey: unitsCellKey(sourceBase) })

  const focusEditableRef = useRef(focusEditable)
  useEffect(() => {
    focusEditableRef.current = focusEditable
  })

  // Restore focus after edits commit so the caret stays anchored through React rerenders.
  useEffect(() => {
    const where = pendingFocusRef.current
    pendingFocusRef.current = null
    if (where) focusTarget(where)
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
    const caretIsInSurface = () =>
      document.activeElement instanceof HTMLInputElement && document.activeElement.dataset.digit === 'true'
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

  // Applying an update is all App does with it: the entry state machine decides, and the
  // caret follows only when the decision asked for it.
  const apply = (update: EntryUpdate | null) => {
    if (!update) return
    setEntry(update.state)
    pendingFocusRef.current = update.focus
  }

  const onCellKeyDown = (event: KeyboardEvent<HTMLInputElement>, base: Base, boxes: string[]) => {
    const action = keyActionFor(event.key, event, base.radix, sourceBase.radix)
    if (!action) return

    event.preventDefault()
    if (action.kind === 'digit') apply(entryForDigit(entry, base, boxes, action.raw))
    else if (action.kind === 'delete') apply(entryForDeletion(entry, base, boxes))
    else apply(entryForStep(entry, sourceBase, action.delta))
  }

  const onTab = (event: KeyboardEvent, target: FocusTarget | null) => {
    if (!target) return
    event.preventDefault()
    focusTarget(target)
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
            onEditDigit={(base, boxes, raw) => apply(entryForDigit(entry, base, boxes, raw))}
            registerCell={(cellKey) => (node) => {
              if (node) cellsRef.current.set(cellKey, node)
              else cellsRef.current.delete(cellKey)
            }}
            registerBreakdownToggle={(key) => (node) => {
              if (node) breakdownTogglesRef.current.set(key, node)
              else breakdownTogglesRef.current.delete(key)
            }}
            onTabFromUnits={(event, base) => onTab(event, tabFromUnits(base, event.shiftKey))}
            onTabFromToggle={(event, base, breakdownOpen) => onTab(
              event,
              tabFromToggle(base, event.shiftKey, breakdownOpen && hasBreakdownTerm(base)),
            )}
            onTabFromBreakdownTerm={(event, base, isFirst, isLast) => onTab(
              event,
              tabFromBreakdownTerm(base, event.shiftKey, isFirst, isLast),
            )}
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

// The breakdown only exists in the DOM once a row has opened it, so its terms are the one
// Tab target App has to look up rather than reach through a registered ref.
function hasBreakdownTerm(base: Base) {
  return document.getElementById(breakdownIdFor(base))?.querySelector('[data-breakdown-term]') !== null
}

export default App
