import type { CSSProperties, KeyboardEvent, Ref } from 'react'
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
//
// The accent-derived colours arrive as inline *custom properties*, not as inline colours:
// the skins live in `.digit-box` (src/index.css) and read these variables. That is what
// lets one composed box-shadow carry both the recessed bevel and the highlight ring, so a
// focused writable cell can show its inset, focus frame and outline at the same time —
// an inline box-shadow would silently win over any class-based one.
export function DigitBox({ base, position, digit, editable, highlighted, surfaceRef, onKeyDown, onEditDigit }: DigitBoxProps) {
  const bitRange = bitRangeForDigit(base.radix, position)

  return (
    <input
      className={`digit-box min-h-10 w-full min-w-0 p-0 text-center mono-tech text-[clamp(11px,2.5vw,17px)] font-semibold leading-none tracking-[0.02em] text-ink transition ${editable ? 'font-bold focus-visible:border-focus focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus' : 'cursor-default'}`}
      type="text"
      data-digit="true"
      data-editable={editable || undefined}
      data-position={position}
      data-highlighted={highlighted || undefined}
      style={{
        '--digit-accent': base.accent,
        '--digit-frame': `color-mix(in srgb, ${base.accent} 70%, #172b4d)`,
      } as CSSProperties}
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
