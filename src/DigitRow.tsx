import type { KeyboardEvent, RefCallback } from 'react'
import { POSITIONS, VALUE_LIMIT, type Base } from './conversion'

type DigitRowProps = {
  base: Base
  boxes: string[]
  isSource: boolean
  onDigitKeyDown: (event: KeyboardEvent<HTMLInputElement>, base: Base, boxes: string[]) => void
  onEditDigit: (base: Base, boxes: string[], index: number, raw: string) => void
  registerCell: (key: string) => RefCallback<HTMLInputElement>
  onStep: (delta: bigint) => void
}

const buttonClass = 'grid size-7 shrink-0 place-items-center rounded-md border border-[#dbe3ee] bg-white font-mono text-sm font-bold leading-none text-[#344761] transition hover:border-[#2458d3] hover:text-[#2458d3]'

export function DigitRow({ base, boxes, isSource, onDigitKeyDown, onEditDigit, registerCell, onStep }: DigitRowProps) {
  const maxDigits = VALUE_LIMIT.toString(base.radix).length

  return (
    <tr className="bg-white">
      <th className="sticky left-0 z-10 border-b border-[#eef2f8] bg-inherit py-3 pr-3 align-middle font-normal" scope="row">
        <span className="flex flex-wrap items-center gap-2">
          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: base.accent }} aria-hidden="true" />
          <span className="text-[13px] font-bold text-[#172b4d]">{base.name}</span>
          <span className="font-mono text-[11px] text-[#8190a5]">{base.radix}</span>
        </span>
        {isSource && (
          <span className="mt-2 flex items-center gap-1" role="group" aria-label={`Step the ${base.name} value`}>
            <button
              className={buttonClass}
              type="button"
              aria-label={`Decrease the ${base.name} value by one`}
              title="Step down by one (ArrowDown)"
              onMouseDown={(event) => event.preventDefault()}
              tabIndex={-1}
              onClick={() => onStep(-1n)}
            >
              {'\u2212'}
            </button>
            <button
              className={buttonClass}
              type="button"
              aria-label={`Increase the ${base.name} value by one`}
              title="Step up by one (ArrowUp)"
              onMouseDown={(event) => event.preventDefault()}
              tabIndex={-1}
              onClick={() => onStep(1n)}
            >
              +
            </button>
          </span>
        )}
      </th>
      <td className="border-b border-[#eef2f8] py-3 pl-3 align-middle">
        <ol className="m-0 grid w-full list-none gap-px p-0" style={{ gridTemplateColumns: `repeat(${boxes.length}, minmax(0, 1fr))` }} aria-label={`${base.name} digits, most significant first`}>
            {boxes.map((digit, index) => {
              const position = boxes.length - 1 - index
              const disabled = position >= maxDigits
              const cellKey = `${base.key}:${index}`
              return (
                <li className="m-0 flex min-w-0 flex-col items-center" key={cellKey}>
                  <input
                    className="aspect-square w-full min-w-0 rounded-[4px] border border-[#dbe3ee] bg-white p-0 text-center font-mono text-[clamp(9px,2.5vw,17px)] font-semibold leading-none tabular-nums text-[#172b4d] outline-none transition hover:border-[#a9bad2] focus:border-[#2458d3] focus:ring-2 focus:ring-[#2458d3]/25 disabled:cursor-not-allowed disabled:border-[#e3e9f1] disabled:bg-[#f1f4f8] disabled:text-[#a3b0c2]"
                    type="text"
                    data-digit="true"
                    ref={registerCell(cellKey)}
                    inputMode={base.radix <= 10 ? 'numeric' : 'text'}
                    autoComplete="off"
                    spellCheck={false}
                    value={digit}
                    tabIndex={index === POSITIONS - 1 ? 0 : -1}
                    disabled={disabled}
                    title={disabled ? `Unavailable: beyond the ${POSITIONS}-bit value limit` : undefined}
                    onFocus={(event) => event.target.select()}
                    onKeyDown={(event) => onDigitKeyDown(event, base, boxes)}
                    onChange={(event) => onEditDigit(base, boxes, index, event.target.value)}
                    aria-label={`${base.name} (base ${base.radix}) digit at position ${position}`}
                  />
                  <span className="w-full pt-1 text-center font-mono text-[9px] leading-none text-[#a3b0c2]" aria-hidden="true">
                    {position}
                  </span>
                </li>
              )
            })}
        </ol>
      </td>
    </tr>
  )
}
