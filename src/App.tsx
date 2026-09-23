import { useEffect, useRef, useState } from 'react'

type Base = {
  key: string
  name: string
  radix: number
  digits: string
  prefix: string
  pattern: RegExp
}

const bases: Base[] = [
  { key: 'decimal', name: 'Decimal', radix: 10, digits: '0–9', prefix: '', pattern: /^\d+$/ },
  { key: 'binary', name: 'Binary', radix: 2, digits: '0–1', prefix: '0b', pattern: /^[01]+$/ },
  { key: 'octal', name: 'Octal', radix: 8, digits: '0–7', prefix: '0o', pattern: /^[0-7]+$/ },
  { key: 'hexadecimal', name: 'Hexadecimal', radix: 16, digits: '0–9 and A–F', prefix: '0x', pattern: /^[\da-f]+$/i },
]

const baseAccents: Record<string, string> = {
  decimal: '#e8aa42',
  binary: '#4381e6',
  octal: '#37a88d',
  hexadecimal: '#9170d7',
}

function App() {
  const [input, setInput] = useState('42')
  const [inputBaseKey, setInputBaseKey] = useState('decimal')
  const inputBase = bases.find(({ key }) => key === inputBaseKey) ?? bases[0]
  const hasValue = input.length > 0
  const hasValidDigits = inputBase.pattern.test(input)
  const numericValue = hasValue && hasValidDigits ? BigInt(`${inputBase.prefix}${input}`) : null
  const isValid = numericValue !== null && numericValue <= BigInt(Number.MAX_SAFE_INTEGER)
  const error = hasValue && !isValid
    ? hasValidDigits
      ? 'That number is too large to convert accurately. Try a smaller whole number.'
      : `Enter digits ${inputBase.digits} for base ${inputBase.radix}.`
    : ''
  const conversions = bases.map((base) => ({
    base,
    digits: isValid && numericValue !== null
      ? Array.from(numericValue.toString(base.radix).toUpperCase())
      : null,
  }))
  const digitCounts = conversions.map(({ digits }) => digits?.length ?? 0).join('-')
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scroller = scrollerRef.current
    if (scroller) scroller.scrollLeft = scroller.scrollWidth
  }, [digitCounts, inputBaseKey])

  const changeInputBase = (key: string) => {
    const nextBase = bases.find((base) => base.key === key)
    if (!nextBase) return

    if (input && inputBase.pattern.test(input)) {
      const value = BigInt(`${inputBase.prefix}${input}`)
      setInput(value.toString(nextBase.radix).toUpperCase())
    }
    setInputBaseKey(key)
  }

  return (
    <main className="mx-auto w-full max-w-[760px] px-4 pb-16 text-[#172b4d] sm:px-6" id="top">
      <header className="flex items-baseline justify-between py-6 sm:py-8">
        <a className="text-[15px] font-bold tracking-tight text-[#172b4d] no-underline" href="#top">basewise</a>
        <span className="text-[11px] text-[#63728a]">positional notation, plainly</span>
      </header>

      <section aria-labelledby="page-title">
        <h1 className="mt-5 text-[clamp(22px,3.4vw,28px)] font-bold leading-tight tracking-[-0.6px]" id="page-title">
          One number, four bases
        </h1>

        <div className="mt-6">
          <label className="mb-2 block text-xs font-semibold text-[#63728a]" htmlFor="number-input">
            Your {inputBase.name} number
          </label>
          <div className={`flex min-h-[56px] items-center gap-3 rounded-[10px] border bg-white px-4 transition focus-within:border-[#2458d3] focus-within:ring-[3px] focus-within:ring-[#2458d3]/15 ${error ? 'border-[#bd3b46]' : 'border-[#cdd7e5]'}`}>
            <input
              className="w-full min-w-0 border-0 bg-transparent font-mono text-[24px] font-semibold text-[#172b4d] outline-none"
              id="number-input"
              type="text"
              inputMode={inputBase.radix === 16 ? 'text' : 'numeric'}
              autoComplete="off"
              spellCheck={false}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              aria-describedby={error ? 'input-error' : 'input-help'}
              aria-invalid={Boolean(error)}
            />
          </div>
          <p className={`mt-2 min-h-5 text-xs leading-relaxed ${error ? 'text-[#a52736]' : 'text-[#63728a]'}`} id={error ? 'input-error' : 'input-help'} role={error ? 'alert' : undefined}>
            {error || `Digits ${inputBase.digits}. Reading as base ${inputBase.radix}.`}
          </p>
        </div>

        <div className="mt-10">
          <h2 className="m-0 text-xs font-semibold text-[#63728a]" id="result-title">The same value, written out</h2>
          <p className="mt-1.5 text-xs text-[#8190a5]">Each column holds one position; the rightmost column is always the units digit.</p>

          <div className="mt-4 overflow-x-auto" ref={scrollerRef}>
            <table className="w-full border-separate border-spacing-0 text-left" aria-labelledby="result-title">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-[104px] border-b border-[#e3e9f1] bg-white pb-2 text-[10px] font-bold uppercase tracking-[0.9px] text-[#8190a5]" scope="col">Base</th>
                <th className="border-b border-[#e3e9f1] pb-2 pl-3 text-[10px] font-bold uppercase tracking-[0.9px] text-[#8190a5]" scope="col">Written out</th>
              </tr>
            </thead>
            <tbody aria-live="polite" aria-atomic="true">
              {conversions.map(({ base, digits }) => {
                const isSource = base.key === inputBaseKey
                return (
                  <tr className={isSource ? 'bg-[#f7f9fc]' : 'bg-white'} key={base.key}>
                    <th className="sticky left-0 z-10 border-b border-[#eef2f8] bg-inherit py-3 pr-3 align-middle font-normal" scope="row">
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: baseAccents[base.key] }} aria-hidden="true" />
                        <span className="text-[13px] font-bold text-[#172b4d]">{base.name}</span>
                        <span className="font-mono text-[11px] text-[#8190a5]">{base.radix}</span>
                      </span>
                      <span className="sr-only">{isSource ? ' (source base)' : ''}</span>
                    </th>
                    <td className="border-b border-[#eef2f8] py-3 pl-3 align-middle">
                      {digits ? (
                        <div className="flex items-end justify-end gap-2">
                          <ol className="m-0 flex list-none justify-end gap-px p-0" aria-label={`${base.name} digits, most significant first`}>
                            {digits.map((digit, index) => (
                              <li className="m-0 flex flex-col items-center" key={`${base.key}-${index}`}>
                                <span className="grid size-[clamp(18px,4.4vw,30px)] shrink-0 place-items-center rounded-[4px] border border-[#dbe3ee] font-mono text-[clamp(12px,2.9vw,17px)] font-semibold leading-none tabular-nums text-[#172b4d]">
                                  {digit}
                                </span>
                                <span className="size-[clamp(18px,4.4vw,30px)] shrink-0 pt-1 text-center font-mono text-[9px] leading-none text-[#a3b0c2]" aria-hidden="true">
                                  {digits.length - 1 - index}
                                </span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      ) : (
                        <span className="block text-right font-mono text-xl text-[#a3b0c2]">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="m-0 text-xs font-semibold text-[#63728a]" id="input-base-title">I typed in</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-labelledby="input-base-title">
            {bases.map((base) => {
              const isSelected = base.key === inputBaseKey
              return (
                <label className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium transition ${isSelected ? 'border-[#2458d3] bg-[#f0f4ff] text-[#172b4d]' : 'border-[#e3e9f1] text-[#344761] hover:border-[#a9bad2]'} has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#2458d3]`} key={base.key}>
                  <input
                    className="sr-only"
                    type="radio"
                    name="input-base"
                    value={base.key}
                    checked={isSelected}
                    onChange={() => changeInputBase(base.key)}
                  />
                  {base.name}
                </label>
              )
            })}
          </div>
        </div>

        <p className="mt-10 border-t border-[#e7edf5] pt-5 text-xs leading-relaxed text-[#63728a]">
          The number itself never changes — only the symbols that hold it, and how many places they need.
        </p>
      </section>
    </main>
  )
}

export default App
