import type { KeyboardEvent, RefCallback } from 'react'
import type { Base, BitGrouping } from './conversion'

type DigitRowProps = {
  base: Base
  boxes: string[]
  isSource: boolean
  grouping: BitGrouping | null
  onDigitKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  onEditDigit: (base: Base, boxes: string[], index: number, raw: string) => void
  registerCell: (key: string) => RefCallback<HTMLInputElement>
}

function GroupingUnderbox({ grouping }: { grouping: BitGrouping | null }) {
  if (grouping === null) return null

  const { base, size, groups } = grouping

  return (
    <div className="flex w-full min-w-0 flex-col gap-1" aria-hidden="true">
      <span className="whitespace-nowrap font-mono text-[9px] font-semibold uppercase tracking-[0.5px]" style={{ color: base.accent }}>
        {`${base.name.toLowerCase()} · ${size} bits`}
      </span>
      <ol className="m-0 grid w-full min-w-0 list-none gap-px p-0" style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))` }}>
        {groups.map((group, index) => (
          <li className="flex min-w-0 flex-col items-center gap-px rounded-[5px]" key={index} style={{ backgroundColor: `${base.accent}1f` }}>
            <span className="flex w-full gap-px">
              {Array.from({ length: group.placeholders }, (_, slot) => (
                <span className="aspect-[10/7] min-w-0 flex-1 rounded-[3px] border border-dashed border-[#c9d4e3]" key={`missing-${slot}`} />
              ))}
              {group.bits.map((_, slot) => (
                <span className="aspect-[10/7] min-w-0 flex-1 rounded-[3px] border" style={{ borderColor: base.accent }} key={slot} />
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

export function DigitRow({ base, boxes, isSource, grouping, onDigitKeyDown, onEditDigit, registerCell }: DigitRowProps) {
  return (
    <tr className={isSource ? 'bg-[#f7f9fc]' : 'bg-white'}>
      <th className="sticky left-0 z-10 border-b border-[#eef2f8] bg-inherit py-3 pr-3 align-middle font-normal" scope="row">
        <span className="flex flex-wrap items-center gap-2">
          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: base.accent }} aria-hidden="true" />
          <span className="text-[13px] font-bold text-[#172b4d]">{base.name}</span>
          <span className="font-mono text-[11px] text-[#8190a5]">{base.radix}</span>
          {isSource && (
            <span className="rounded-full border border-[#2458d3]/30 bg-[#f0f4ff] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.6px] text-[#2458d3]">source</span>
          )}
        </span>
      </th>
      <td className="border-b border-[#eef2f8] py-3 pl-3 align-middle">
        <div className="flex w-full min-w-0 flex-col items-stretch gap-2">
          <ol className="m-0 grid w-full list-none gap-px p-0" style={{ gridTemplateColumns: `repeat(${boxes.length}, minmax(0, 1fr))` }} aria-label={`${base.name} digits, most significant first`}>
            {boxes.map((digit, index) => {
              const position = boxes.length - 1 - index
              const cellKey = `${base.key}:${index}`
              return (
                <li className="m-0 flex min-w-0 flex-col items-center" key={cellKey}>
                  <input
                    className={`aspect-square w-full min-w-0 rounded-[4px] border bg-white p-0 text-center font-mono text-[clamp(9px,2.5vw,17px)] font-semibold leading-none tabular-nums text-[#172b4d] outline-none transition focus:border-[#2458d3] focus:ring-2 focus:ring-[#2458d3]/25 ${isSource ? '' : 'border-[#dbe3ee] hover:border-[#a9bad2]'}`}
                    style={isSource ? { borderColor: base.accent } : undefined}
                    type="text"
                    data-digit="true"
                    ref={registerCell(cellKey)}
                    inputMode={base.radix <= 10 ? 'numeric' : 'text'}
                    autoComplete="off"
                    spellCheck={false}
                    value={digit}
                    onFocus={(event) => event.target.select()}
                    onKeyDown={onDigitKeyDown}
                    onChange={(event) => onEditDigit(base, boxes, index, event.target.value)}
                    aria-label={`${base.name} (base ${base.radix}) digit at position ${position}${isSource ? ', source base' : ''}`}
                  />
                  <span className="w-full pt-1 text-center font-mono text-[9px] leading-none text-[#a3b0c2]" aria-hidden="true">
                    {position}
                  </span>
                </li>
              )
            })}
          </ol>
          <GroupingUnderbox grouping={grouping} />
        </div>
      </td>
    </tr>
  )
}
