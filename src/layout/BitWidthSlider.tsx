import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

type BitWidthSliderProps = {
  widths: readonly number[]
  value: number
  disabledWidths: readonly number[]
  onChange: (width: number) => void
}

export function BitWidthSlider({ widths, value, disabledWidths, onChange }: BitWidthSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const valueIndex = widths.indexOf(value)
  const isUnavailable = (width: number) => disabledWidths.includes(width)
  const setWidthAtIndex = (index: number) => {
    const requestedWidth = widths[index]
    if (requestedWidth === undefined) return
    if (!isUnavailable(requestedWidth) || requestedWidth === value) {
      onChange(requestedWidth)
      return
    }

    let nearestWidth: number | undefined
    for (const width of widths) {
      if (isUnavailable(width)) continue
      const currentDistance = Math.abs(widths.indexOf(width) - index)
      const nearestDistance = nearestWidth === undefined ? Infinity : Math.abs(widths.indexOf(nearestWidth) - index)
      if (currentDistance <= nearestDistance) nearestWidth = width
    }
    if (nearestWidth !== undefined) onChange(nearestWidth)
  }
  const moveToNextAvailableWidth = (direction: -1 | 1) => {
    for (let index = valueIndex + direction; index >= 0 && index < widths.length; index += direction) {
      const width = widths[index]
      if (width !== undefined && !isUnavailable(width)) {
        onChange(width)
        return
      }
    }
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') moveToNextAvailableWidth(1)
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') moveToNextAvailableWidth(-1)
    else if (event.key === 'Home') setWidthAtIndex(0)
    else if (event.key === 'End') setWidthAtIndex(widths.length - 1)
    else if (event.key === 'PageUp') setWidthAtIndex(widths.length - 1)
    else if (event.key === 'PageDown') setWidthAtIndex(0)
    else return
    event.preventDefault()
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    const pointerStart = pointerStartRef.current
    if (pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 4) setIsDragging(true)
    const track = trackRef.current
    if (!track) return
    const { left, width } = track.getBoundingClientRect()
    const progress = Math.max(0, Math.min(1, (event.clientX - left) / width))
    setWidthAtIndex(Math.round(progress * (widths.length - 1)))
  }
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.currentTarget.focus()
    event.currentTarget.setPointerCapture(event.pointerId)
    pointerStartRef.current = { x: event.clientX, y: event.clientY }
    onPointerMove(event)
  }

  const onPointerUp = () => {
    pointerStartRef.current = null
    setIsDragging(false)
  }

  return (
    <div
      id="bit-width-slider"
      className="group relative h-14 w-[min(274px,25vw)] cursor-pointer touch-pan-y select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:w-[min(274px,38vw)]"
      role="slider"
      tabIndex={0}
      aria-label="Bit width"
      aria-orientation="horizontal"
      aria-valuemin={widths[0]}
      aria-valuemax={widths[widths.length - 1]}
      aria-valuenow={value}
      aria-valuetext={`${value} bits${disabledWidths.length > 0 ? `; unavailable widths: ${disabledWidths.join(', ')}` : ''}`}
      aria-describedby="selected-bit-width width-guidance"
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onLostPointerCapture={onPointerUp}
    >
      <div className="absolute inset-y-0 left-[18px] right-[18px]" ref={trackRef}>
        <div aria-hidden="true" className="absolute -inset-x-3 top-0 h-8 border-2 border-frame bg-well shadow-[inset_2px_2px_0_rgb(23_43_77_/_0.24),inset_-2px_-2px_0_rgb(255_255_255_/_0.7)]" data-slider-channel="true" />
        {widths.map((width, index) => {
          const position = `${(index / (widths.length - 1)) * 100}%`
          const unavailable = isUnavailable(width)
          return (
            <span
              aria-hidden="true"
              className={`absolute top-3 h-[7px] w-[2px] -translate-x-1/2 ${unavailable ? 'bg-rule' : 'bg-frame'}`}
              key={width}
              style={{ left: position }}
            />
          )
        })}
        {widths.map((width, index) => {
          const unavailable = isUnavailable(width)
          return (
            <span
              aria-hidden="true"
              className={`absolute top-10 -translate-x-1/2 text-center mono-tech text-[10px] leading-none ${unavailable || value !== width ? 'text-ink-soft' : 'text-ink'}`}
              key={width}
              style={{ left: `${(index / (widths.length - 1)) * 100}%` }}
            >
              <span className={value === width ? 'font-bold' : ''}>{width}</span>
              {unavailable && (
                <span className="mt-1 block text-[9px] uppercase tracking-[-0.04em]">
                  <span className="sm:hidden">!</span>
                  <span className="hidden sm:inline">unavailable</span>
                </span>
              )}
            </span>
          )
        })}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-full ${isDragging ? 'transition-none' : 'transition-transform duration-200 ease-out motion-reduce:transition-none'}`}
          data-slider-thumb="true"
          style={{ transform: `translateX(${(valueIndex / (widths.length - 1)) * 100}%)` }}
        >
          <span className="absolute left-0 top-0 flex h-8 w-8 -translate-x-1/2 items-center justify-center border-2 border-frame bg-paper-3 mono-tech text-[10px] font-bold text-ink shadow-[inset_2px_2px_0_rgb(255_255_255_/_0.95),inset_-2px_-2px_0_rgb(23_43_77_/_0.4)] group-hover:bg-paper-2">
            {isUnavailable(value) ? '!' : ''}
          </span>
        </span>
      </div>
    </div>
  )
}
