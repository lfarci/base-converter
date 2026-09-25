import type { KeyboardEvent, Ref } from 'react'
import { bitRangeForDigit, type Base } from '../core/conversion'

type DigitBoxProps = {
  base: Base
  position: number
  digit: string
  editable: boolean
  highlighted: boolean
  surfaceRef: Ref<HTMLInputElement>
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  onEditDigit: (raw: string) => void
}

// One place of one row. Only the units box of a row is editable; the rest are read-only
// readouts of the same value, so they never focus, never paint a frame and never show a
// write cursor.
export function DigitBox({ base, position, digit, editable, highlighted, surfaceRef, onKeyDown, onEditDigit }: DigitBoxProps) {
  const bitRange = bitRangeForDigit(base.radix, position)
  const editableBorderColor = `color-mix(in srgb, ${base.accent} 70%, #172b4d)`
  const boxStyle = highlighted
    ? { backgroundColor: `color-mix(in srgb, ${base.accent} 12%, white)`, borderColor: editable ? editableBorderColor : base.accent }
    : editable
      ? { backgroundColor: `color-mix(in srgb, ${base.accent} 8%, white)`, borderColor: editableBorderColor }
      : undefined

  return (
    <input
      className={`h-10 w-full min-w-0 rounded-[4px] border border-[#dbe3ee] bg-white p-0 text-center font-mono text-[clamp(9px,2.5vw,17px)] font-semibold leading-none tabular-nums text-[#172b4d] outline-none transition ${editable ? 'border-2 font-bold shadow-sm focus:border-[#2458d3] focus:ring-2 focus:ring-[#2458d3]/25' : 'cursor-default'}`}
      type="text"
      data-digit="true"
      data-editable={editable || undefined}
      data-position={position}
      data-highlighted={highlighted || undefined}
      style={boxStyle}
      ref={surfaceRef}
      inputMode={base.radix <= 10 ? 'numeric' : 'text'}
      autoComplete="off"
      spellCheck={false}
      readOnly={!editable}
      value={digit}
      tabIndex={editable ? 0 : -1}
      onMouseDown={editable ? undefined : (event) => event.preventDefault()}
      onFocus={editable ? (event) => event.target.select() : undefined}
      onKeyDown={editable ? onKeyDown : undefined}
      onChange={editable ? (event) => onEditDigit(event.target.value) : undefined}
      aria-label={`${base.name} (base ${base.radix}) digit at position ${position}${bitRange ? `, ${bitRange}` : ''}`}
    />
  )
}
