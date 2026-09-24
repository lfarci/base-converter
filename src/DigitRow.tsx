import { useState, type KeyboardEvent, type RefCallback } from 'react'
import { POSITIONS, VALUE_LIMIT, type Base } from './conversion'
import { PlaceValueBreakdown } from './PlaceValueBreakdown'

type DigitRowProps = {
  base: Base
  boxes: string[]
  value: bigint | null
  onDigitKeyDown: (event: KeyboardEvent<HTMLInputElement>, base: Base, boxes: string[], index: number) => void
  onEditDigit: (base: Base, boxes: string[], index: number, raw: string) => void
  registerCell: (key: string) => RefCallback<HTMLInputElement>
  registerBreakdownToggle: (key: string) => RefCallback<HTMLButtonElement>
  onTabFromUnits: (event: KeyboardEvent<HTMLInputElement>, base: Base) => void
  onTabFromToggle: (event: KeyboardEvent<HTMLButtonElement>, base: Base, breakdownOpen: boolean) => void
  onTabFromBreakdownTerm: (event: KeyboardEvent<HTMLSpanElement>, base: Base, isFirst: boolean, isLast: boolean) => void
}

export function DigitRow({ base, boxes, value, onDigitKeyDown, onEditDigit, registerCell, registerBreakdownToggle, onTabFromUnits, onTabFromToggle, onTabFromBreakdownTerm }: DigitRowProps) {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false)
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null)
  const [focusedPosition, setFocusedPosition] = useState<number | null>(null)
  const maxDigits = VALUE_LIMIT.toString(base.radix).length
  const breakdownId = `${base.key}-place-value-breakdown`
  const highlightedPosition = hoveredPosition ?? focusedPosition

  return (
    <>
      <tr className="bg-white">
        <th className="sticky left-0 z-10 w-[176px] border-b border-[#eef2f8] bg-inherit py-3 pr-3 align-middle font-normal" scope="row">
          <span className="flex items-center gap-1.5">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: base.accent }} aria-hidden="true" />
            <span className="whitespace-nowrap text-[13px] font-bold text-[#172b4d]">{base.name}</span>
            <button
              className="inline-flex size-11 shrink-0 items-center justify-center rounded text-[#63728a] transition hover:bg-[#f1f4f8] hover:text-[#172b4d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2458d3]"
              type="button"
              ref={registerBreakdownToggle(base.key)}
              onKeyDown={(event) => {
                if (event.key === 'Tab') onTabFromToggle(event, base, isBreakdownOpen)
              }}
              aria-expanded={isBreakdownOpen}
              aria-controls={breakdownId}
              aria-label={`${isBreakdownOpen ? 'Hide' : 'Show'} ${base.name} place-value breakdown`}
              onClick={() => setIsBreakdownOpen((open) => !open)}
            >
              <span className={`size-2 border-r-2 border-t-2 transition-transform ${isBreakdownOpen ? 'rotate-[135deg]' : 'rotate-45'}`} aria-hidden="true" />
            </button>
            <span className="font-mono text-[11px] text-[#8190a5]">{base.radix}</span>
          </span>
        </th>
        <td className="border-b border-[#eef2f8] py-3 pl-3 pr-3 align-middle">
          <ol className="m-0 grid w-full list-none gap-px p-0" style={{ gridTemplateColumns: `repeat(${boxes.length}, minmax(0, 1fr))` }} aria-label={`${base.name} digits, most significant first`}>
              {boxes.map((digit, index) => {
                const position = boxes.length - 1 - index
                const disabled = position >= maxDigits
                const cellKey = `${base.key}:${index}`
                return (
                  <li
                    className="m-0 flex min-w-0 flex-col items-center gap-1"
                    key={cellKey}
                    onMouseEnter={() => setHoveredPosition(position)}
                    onMouseLeave={() => setHoveredPosition(null)}
                    onFocusCapture={() => setFocusedPosition(position)}
                    onBlurCapture={() => setFocusedPosition(null)}
                  >
                    <input
                      className="aspect-square w-full min-w-0 rounded-[4px] border border-[#dbe3ee] bg-white p-0 text-center font-mono text-[clamp(9px,2.5vw,17px)] font-semibold leading-none tabular-nums text-[#172b4d] outline-none transition hover:border-[#a9bad2] focus:border-[#2458d3] focus:ring-2 focus:ring-[#2458d3]/25 disabled:cursor-not-allowed disabled:border-[#e3e9f1] disabled:bg-[#f1f4f8] disabled:text-[#a3b0c2]"
                      type="text"
                      data-digit="true"
                      data-position={position}
                      data-highlighted={highlightedPosition === position || undefined}
                      style={highlightedPosition === position && !disabled ? { backgroundColor: `color-mix(in srgb, ${base.accent} 12%, white)`, borderColor: base.accent } : undefined}
                      ref={registerCell(cellKey)}
                      inputMode={base.radix <= 10 ? 'numeric' : 'text'}
                      autoComplete="off"
                      spellCheck={false}
                      value={digit}
                      tabIndex={index === POSITIONS - 1 ? 0 : -1}
                      disabled={disabled}
                      title={disabled ? `Unavailable: beyond the ${POSITIONS}-bit value limit` : undefined}
                      onFocus={(event) => event.target.select()}
                      onKeyDown={(event) => {
                        if (event.key === 'Tab' && index === POSITIONS - 1) onTabFromUnits(event, base)
                        else onDigitKeyDown(event, base, boxes, index)
                      }}
                      onChange={(event) => onEditDigit(base, boxes, index, event.target.value)}
                      aria-label={`${base.name} (base ${base.radix}) digit at position ${position}`}
                    />
                    <span
                      className="place-value-label flex flex-col items-center gap-0.5 whitespace-nowrap rounded-sm border border-transparent px-0.5 py-0.5 font-mono text-[9px] leading-none text-[#63728a]"
                      data-position={position}
                      data-highlighted={highlightedPosition === position || undefined}
                      style={highlightedPosition === position ? { backgroundColor: `color-mix(in srgb, ${base.accent} 12%, white)`, borderColor: base.accent, color: '#172b4d', fontWeight: 600 } : undefined}
                    >
                      <span>{base.radix}<sup>{position}</sup></span>
                    </span>
                  </li>
                )
              })}
          </ol>
        </td>
      </tr>
      {isBreakdownOpen && (
        <tr>
          <td className="border-b border-[#eef2f8] bg-[#f8fafd] p-0" colSpan={2}>
            <div id={breakdownId}>
              <PlaceValueBreakdown
                base={base}
                boxes={boxes}
                value={value}
                highlightedPosition={highlightedPosition}
                onHoverPosition={setHoveredPosition}
                onFocusPosition={setFocusedPosition}
                onTabFromTerm={onTabFromBreakdownTerm}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
