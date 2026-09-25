import { useState, type KeyboardEvent, type RefCallback } from 'react'
import { bitRangeForDigit, POSITIONS, type Base, type BitSpan } from './conversion'
import { PlaceValueBreakdown } from './PlaceValueBreakdown'

type DigitRowProps = {
  base: Base
  boxes: string[]
  value: bigint | null
  highlightedBits: BitSpan | null
  onHoverPosition: (position: number | null) => void
  onFocusPosition: (position: number | null) => void
  onDigitKeyDown: (event: KeyboardEvent<HTMLInputElement>, base: Base, boxes: string[], index: number) => void
  onEditDigit: (base: Base, boxes: string[], index: number, raw: string) => void
  registerCell: (key: string) => RefCallback<HTMLInputElement>
  registerBreakdownToggle: (key: string) => RefCallback<HTMLButtonElement>
  onTabFromUnits: (event: KeyboardEvent<HTMLInputElement>, base: Base) => void
  onTabFromToggle: (event: KeyboardEvent<HTMLButtonElement>, base: Base, breakdownOpen: boolean) => void
  onTabFromBreakdownTerm: (event: KeyboardEvent<HTMLSpanElement>, base: Base, isFirst: boolean, isLast: boolean) => void
}

export function DigitRow({ base, boxes, value, highlightedBits, onHoverPosition, onFocusPosition, onDigitKeyDown, onEditDigit, registerCell, registerBreakdownToggle, onTabFromUnits, onTabFromToggle, onTabFromBreakdownTerm }: DigitRowProps) {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false)
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null)
  const [focusedPosition, setFocusedPosition] = useState<number | null>(null)
  const lastIndex = boxes.length - 1
  const breakdownId = `${base.key}-place-value-breakdown`
  const registerToggle = registerBreakdownToggle(base.key)
  const highlightedPosition = hoveredPosition ?? focusedPosition
  const bitsPerDigit = Math.log2(base.radix)
  const usesBitGrid = Number.isInteger(bitsPerDigit)
  const hoverPosition = (position: number | null) => {
    setHoveredPosition(position)
    onHoverPosition(position)
  }
  const focusPosition = (position: number | null) => {
    setFocusedPosition(position)
    onFocusPosition(position)
  }
  return (
    <>
      <tr className="bg-white">
        <th className="sticky left-0 z-10 w-[144px] border-b border-[#eef2f8] bg-inherit py-3 pr-2 align-top font-normal" scope="row" aria-label={base.name}>
          <span className="grid grid-cols-[8px_minmax(0,1fr)_20px] items-center gap-1.5">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: base.accent }} aria-hidden="true" />
            <button
              className="group inline-flex min-h-11 w-full min-w-0 cursor-pointer items-center justify-between gap-1 rounded-sm text-left text-[12px] font-bold text-[#172b4d] underline decoration-transparent underline-offset-4 transition hover:decoration-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2458d3]"
              type="button"
              ref={registerToggle}
              onKeyDown={(event) => {
                if (event.key === 'Tab') onTabFromToggle(event, base, isBreakdownOpen)
              }}
              aria-expanded={isBreakdownOpen}
              aria-controls={breakdownId}
              title={`Click to ${isBreakdownOpen ? 'close' : 'open'} the ${base.name.toLowerCase()} place-value breakdown`}
              aria-label={`Toggle ${base.name} place-value breakdown`}
              onClick={() => setIsBreakdownOpen((open) => !open)}
            >
              <span className="whitespace-nowrap">{base.name}</span>
            </button>
            <span className="w-5 text-right font-mono text-[11px] tabular-nums text-[#8190a5]">{base.radix}</span>
          </span>
        </th>
        <td className="border-b border-[#eef2f8] py-3 pl-3 pr-3 align-middle">
          <ol className="m-0 grid w-full list-none gap-px p-0" style={{ gridTemplateColumns: `repeat(${usesBitGrid ? POSITIONS : boxes.length}, minmax(0, 1fr))` }} aria-label={`${base.name} digits, most significant first`}>
              {boxes.map((digit, index) => {
                const position = boxes.length - 1 - index
                const bitRange = bitRangeForDigit(base.radix, position)
                const cellKey = `${base.key}:${index}`
                const isHighlighted = bitsPerDigit === 1 && highlightedBits
                  ? position >= highlightedBits.low && position <= highlightedBits.high
                  : highlightedPosition === position
                return (
                  <li
                    className="m-0 flex min-w-0 flex-col items-center gap-1"
                    key={cellKey}
                    style={usesBitGrid ? { gridColumn: `span ${Math.min(bitsPerDigit, POSITIONS - position * bitsPerDigit)}` } : undefined}
                    onMouseEnter={() => hoverPosition(position)}
                    onMouseLeave={() => hoverPosition(null)}
                    onFocusCapture={() => focusPosition(position)}
                    onBlurCapture={() => focusPosition(null)}
                  >
                    <input
                      className="h-10 w-full min-w-0 rounded-[4px] border border-[#dbe3ee] bg-white p-0 text-center font-mono text-[clamp(9px,2.5vw,17px)] font-semibold leading-none tabular-nums text-[#172b4d] outline-none transition hover:border-[#a9bad2] focus:border-[#2458d3] focus:ring-2 focus:ring-[#2458d3]/25"
                      type="text"
                      data-digit="true"
                      data-position={position}
                      data-highlighted={isHighlighted || undefined}
                      style={isHighlighted ? { backgroundColor: `color-mix(in srgb, ${base.accent} 12%, white)`, borderColor: base.accent } : undefined}
                      ref={registerCell(cellKey)}
                      inputMode={base.radix <= 10 ? 'numeric' : 'text'}
                      autoComplete="off"
                      spellCheck={false}
                      value={digit}
                      tabIndex={index === lastIndex ? 0 : -1}
                      onFocus={(event) => event.target.select()}
                      onKeyDown={(event) => {
                        if (event.key === 'Tab' && index === lastIndex) onTabFromUnits(event, base)
                        else onDigitKeyDown(event, base, boxes, index)
                      }}
                      onChange={(event) => onEditDigit(base, boxes, index, event.target.value)}
                      aria-label={`${base.name} (base ${base.radix}) digit at position ${position}${bitRange ? `, ${bitRange}` : ''}`}
                    />
                    <span
                      className="place-value-label flex flex-col items-center gap-0.5 whitespace-nowrap rounded-sm border border-transparent px-0.5 py-0.5 font-mono text-[9px] leading-none text-[#63728a]"
                      data-position={position}
                      data-highlighted={isHighlighted || undefined}
                      style={isHighlighted ? { backgroundColor: `color-mix(in srgb, ${base.accent} 12%, white)`, borderColor: base.accent, color: '#172b4d', fontWeight: 600 } : undefined}
                    >
                      <span>{base.radix}<sup>{position}</sup></span>
                      {bitRange && <span className="text-[8px] text-[#8190a5]">{bitRange}</span>}
                    </span>
                  </li>
                )
              })}
          </ol>
        </td>
      </tr>
      {isBreakdownOpen && (
        <tr>
          <td className="border-b border-[#eef2f8] bg-[#f8fafd] py-0 pl-[140px] pr-3" colSpan={2}>
            <div id={breakdownId}>
              <PlaceValueBreakdown
                base={base}
                boxes={boxes}
                value={value}
                highlightedPosition={highlightedPosition}
                onHoverPosition={hoverPosition}
                onFocusPosition={focusPosition}
                onTabFromTerm={onTabFromBreakdownTerm}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
