import { useState, type KeyboardEvent, type RefCallback } from 'react'
import { BaseHeaderCell } from './BaseHeaderCell'
import { DigitBox } from './DigitBox'
import { PlaceValueBreakdown } from '../breakdown/PlaceValueBreakdown'
import { PlaceValueLabel } from './PlaceValueLabel'
import { bitsPerDigit, POSITIONS, usesBitGrid, type Base, type BitSpan } from '../core/conversion'

type DigitRowProps = {
  base: Base
  boxes: string[]
  value: bigint | null
  highlightedBits: BitSpan | null
  onHoverPosition: (position: number | null) => void
  onFocusPosition: (position: number | null) => void
  onDigitKeyDown: (event: KeyboardEvent<HTMLInputElement>, base: Base, boxes: string[]) => void
  onEditDigit: (base: Base, boxes: string[], raw: string) => void
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
  const spansBitGrid = usesBitGrid(base.radix)
  const bitWidth = bitsPerDigit(base.radix)
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
        <BaseHeaderCell
          base={base}
          isBreakdownOpen={isBreakdownOpen}
          breakdownId={breakdownId}
          toggleRef={registerToggle}
          onToggle={() => setIsBreakdownOpen((open) => !open)}
          onToggleKeyDown={(event) => {
            if (event.key === 'Tab') onTabFromToggle(event, base, isBreakdownOpen)
          }}
        />
        <td className="border-b border-[#eef2f8] py-3 pl-3 pr-3 align-middle">
          <ol className="m-0 grid w-full list-none gap-px p-0" style={{ gridTemplateColumns: `repeat(${spansBitGrid ? POSITIONS : boxes.length}, minmax(0, 1fr))` }} aria-label={`${base.name} digits, most significant first`}>
              {boxes.map((digit, index) => {
                const position = boxes.length - 1 - index
                const cellKey = `${base.key}:${index}`
                const isEditable = index === lastIndex
                const isHighlighted = bitWidth === 1 && highlightedBits
                  ? position >= highlightedBits.low && position <= highlightedBits.high
                  : highlightedPosition === position
                return (
                  <li
                    className="m-0 flex min-w-0 flex-col items-center gap-1"
                    key={cellKey}
                    style={spansBitGrid ? { gridColumn: `span ${Math.min(bitWidth, POSITIONS - position * bitWidth)}` } : undefined}
                    onMouseEnter={() => hoverPosition(position)}
                    onMouseLeave={() => hoverPosition(null)}
                    onFocusCapture={() => focusPosition(position)}
                    onBlurCapture={() => focusPosition(null)}
                  >
                    <DigitBox
                      base={base}
                      position={position}
                      digit={digit}
                      editable={isEditable}
                      highlighted={isHighlighted}
                      surfaceRef={registerCell(cellKey)}
                      onKeyDown={(event) => {
                        if (event.key === 'Tab') onTabFromUnits(event, base)
                        else onDigitKeyDown(event, base, boxes)
                      }}
                      onEditDigit={(raw) => onEditDigit(base, boxes, raw)}
                    />
                    <PlaceValueLabel base={base} position={position} highlighted={isHighlighted} />
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
