import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type Ref } from 'react'
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
// accent with ink, so the boundary clears 3:1 on paper and against its own tint where the
// raw accent does not, plus a light accent tint. The mix is 55/45 rather than 70/30 because
// the decimal accent is the lightest of the four: at 70/30 its frame cleared the 3:1
// boundary by only 0.03 against its own tint, which any engine's colour rounding could have
// flipped. At 55/45 the worst accent sits at 4.11:1 against its 12% tint and 4.22:1 against
// the 8% default while each frame still reads as its base's hue. A highlight adds a ring,
// which is a shape cue that survives forced-colors where a tint does not.
//
// The accent-derived colours arrive as inline *custom properties*, not as inline colours:
// the skins live in `.digit-box` (src/index.css) and read these variables. That is what
// lets one composed box-shadow carry both the recessed bevel and the highlight ring, so a
// focused writable cell can show its inset, focus frame and outline at the same time —
// an inline box-shadow would silently win over any class-based one.
export function DigitBox({ base, position, digit, editable, highlighted, surfaceRef, onKeyDown, onEditDigit }: DigitBoxProps) {
  const bitRange = bitRangeForDigit(base.radix, position)
  const [roll, setRoll] = useState<{ from: string; to: string } | null>(null)
  const previousDigit = useRef(digit)

  useLayoutEffect(() => {
    if (previousDigit.current === digit) return

    const from = previousDigit.current
    previousDigit.current = digit
    setRoll(!editable && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? { from, to: digit } : null)
  }, [digit, editable])

  useEffect(() => {
    if (!roll) return

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const clearForReducedMotion = (event: MediaQueryListEvent) => {
      if (event.matches) setRoll(null)
    }
    motionPreference.addEventListener('change', clearForReducedMotion)

    const timeout = window.setTimeout(() => setRoll(null), 280)
    return () => {
      motionPreference.removeEventListener('change', clearForReducedMotion)
      window.clearTimeout(timeout)
    }
  }, [roll])

  return (
    <>
      <input
        className={`digit-box min-h-10 w-full min-w-0 p-0 text-center mono-tech text-[clamp(11px,2.5vw,17px)] font-semibold leading-none tracking-[0.02em] text-ink transition ${editable ? 'font-bold focus-visible:border-focus focus-visible:outline focus-visible:outline-3 focus-visible:outline-focus' : 'cursor-default'}`}
        type="text"
        data-digit="true"
        data-editable={editable || undefined}
        data-position={position}
        data-highlighted={highlighted || undefined}
        data-rolling={roll ? true : undefined}
        style={{
          '--digit-accent': base.accent,
          '--digit-frame': `color-mix(in srgb, ${base.accent} 55%, #172b4d)`,
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
      {roll && (
        <span className="digit-roll mono-tech text-base font-normal leading-[1.5] tracking-[0.02em]" aria-hidden="true">
          <span className="digit-roll-previous">{roll.from}</span>
          <span className="digit-roll-current">{roll.to}</span>
        </span>
      )}
    </>
  )
}
