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
//
// The editable box is a worksheet cell you can write in: a 2px frame mixed from the row's
// accent with ink, so the boundary clears 3:1 on paper where the raw accent does not, plus
// a light accent tint. A highlight adds a ring, which is a shape cue that survives
// forced-colors where a tint does not.
export function DigitBox({ base, position, digit, editable, highlighted, surfaceRef, onKeyDown, onEditDigit }: DigitBoxProps) {
  const bitRange = bitRangeForDigit(base.radix, position)
  const editableBorderColor = `color-mix(in srgb, ${base.accent} 70%, #172b4d)`
  const boxStyle = highlighted
    ? {
        backgroundColor: `color-mix(in srgb, ${base.accent} 12%, var(--color-paper-2))`,
        borderColor: editable ? editableBorderColor : `color-mix(in srgb, ${base.accent} 70%, var(--color-ink))`,
        boxShadow: `0 0 0 2px color-mix(in srgb, ${base.accent} 55%, var(--color-ink))`,
      }
    : editable
      ? { backgroundColor: `color-mix(in srgb, ${base.accent} 8%, var(--color-paper-2))`, borderColor: editableBorderColor }
      : undefined

  return (
    <input
      className={`min-h-10 w-full min-w-0 rounded-[4px] border border-rule-soft bg-paper-2 p-0 text-center font-mono text-[clamp(11px,2.5vw,17px)] font-semibold leading-none tabular-nums text-ink transition ${editable ? 'border-2 font-bold focus:border-focus focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus' : 'cursor-default'}`}
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
