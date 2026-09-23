import { useState } from 'react'

type Base = {
  key: string
  name: string
  radix: number
  subscript: string
  hint: string
  digits: string
  prefix: string
  pattern: RegExp
}

const bases: Base[] = [
  { key: 'decimal', name: 'Decimal', radix: 10, subscript: '₁₀', hint: 'Base 10 · digits 0–9', digits: '0–9', prefix: '', pattern: /^\d+$/ },
  { key: 'binary', name: 'Binary', radix: 2, subscript: '₂', hint: 'Base 2 · digits 0–1', digits: '0–1', prefix: '0b', pattern: /^[01]+$/ },
  { key: 'octal', name: 'Octal', radix: 8, subscript: '₈', hint: 'Base 8 · digits 0–7', digits: '0–7', prefix: '0o', pattern: /^[0-7]+$/ },
  { key: 'hexadecimal', name: 'Hexadecimal', radix: 16, subscript: '₁₆', hint: 'Base 16 · digits 0–9 and A–F', digits: '0–9 and A–F', prefix: '0x', pattern: /^[\da-f]+$/i },
]

function App() {
  const [input, setInput] = useState('42')
  const [inputBaseKey, setInputBaseKey] = useState('decimal')
  const [visibleBaseKeys, setVisibleBaseKeys] = useState(bases.map(({ key }) => key))
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
  const visibleBases = bases.filter(({ key }) => visibleBaseKeys.includes(key))
  const toggleBase = (key: string) => {
    setVisibleBaseKeys((current) => current.includes(key)
      ? current.filter((currentKey) => currentKey !== key)
      : [...current, key])
  }
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
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 text-[#172b4d] sm:px-8">
      <header className="flex h-[70px] items-center justify-between border-b border-[#e3e9f1] sm:h-[88px]">
        <a className="flex items-center gap-2.5 text-[17px] font-bold tracking-tight text-[#172b4d] no-underline" href="#top" aria-label="Basewise home">
          <span className="grid size-[30px] place-items-center rounded-[9px] bg-[#2458d3] font-mono text-base text-white" aria-hidden="true">B</span>
          <span>basewise</span>
        </a>
        <span className="text-[11px] text-[#63728a] sm:text-[13px]">A little number sense</span>
      </header>

      <section className="mx-auto mb-14 mt-11 w-full max-w-[760px] sm:mb-20 sm:mt-16" id="top" aria-labelledby="page-title">
        <div className="mb-7 text-center sm:mb-[38px]">
          <p className="mb-[18px] inline-flex items-center gap-[9px] text-[11px] font-bold tracking-[1.5px] text-[#2458d3]">
            <span className="size-[7px] rounded-full bg-[#51b99a] shadow-[0_0_0_4px_#e6f5f0]" aria-hidden="true" />
            NUMBER SYSTEMS · 01
          </p>
          <h1 className="text-[clamp(36px,6vw,54px)] font-bold leading-[1.08] tracking-[-2.3px] text-[#172b4d]">
            One number.<br /><span className="text-[#2458d3]">Four ways to see it.</span>
          </h1>
          <p className="mx-auto mt-[18px] max-w-[440px] text-sm leading-[1.65] text-[#63728a] sm:text-base">
            Choose a starting base, then watch the same number transform across number systems.
          </p>
        </div>

        <div className="rounded-[13px] border border-[#e3e9f1] bg-white p-4 shadow-[0_16px_44px_rgb(25_48_86_/_7%)] sm:rounded-2xl sm:p-[30px]">
          <div className="mx-auto mb-[27px] max-w-[420px] sm:mb-[34px]">
            <label className="mb-2 block text-sm font-semibold text-[#172b4d]" htmlFor="input-base">Convert from</label>
            <select
              className="mb-4 min-h-11 w-full rounded-[9px] border border-[#cdd7e5] bg-[#fbfcfe] px-3 text-sm font-medium text-[#172b4d] outline-none transition focus:border-[#2458d3] focus:ring-[3px] focus:ring-[#2458d3]/15"
              id="input-base"
              value={inputBaseKey}
              onChange={(event) => changeInputBase(event.target.value)}
            >
              {bases.map((base) => <option value={base.key} key={base.key}>{base.name} (base {base.radix})</option>)}
            </select>
            <label className="mb-[9px] block text-sm font-semibold text-[#172b4d]" htmlFor="number-input">Your {inputBase.name} number</label>
            <div className={`flex min-h-[58px] items-center gap-3 rounded-[10px] border bg-[#fbfcfe] px-[17px] transition focus-within:border-[#2458d3] focus-within:ring-[3px] focus-within:ring-[#2458d3]/15 ${error ? 'border-[#bd3b46]' : 'border-[#cdd7e5]'}`}>
              <span className="font-mono text-[21px] font-bold text-[#2458d3]" aria-hidden="true">{inputBase.radix}<sub className="text-xs">{inputBase.radix}</sub></span>
              <input
                className="w-full min-w-0 border-0 bg-transparent font-mono text-[25px] font-semibold text-[#172b4d] outline-none"
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
              <span className="text-[10px] font-bold tracking-[1.1px] text-[#8190a5]" aria-hidden="true">BASE</span>
            </div>
            <p className={`mt-[7px] min-h-5 text-xs leading-relaxed ${error ? 'text-[#a52736]' : 'text-[#63728a]'}`} id={error ? 'input-error' : 'input-help'} role={error ? 'alert' : undefined}>
              {error || `Use digits ${inputBase.digits}. Conversions update as you type.`}
            </p>
          </div>

          <fieldset className="mb-6 border-0 p-0">
            <legend className="mb-2 text-sm font-semibold text-[#172b4d]">Show bases</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {bases.map((base) => (
                <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-[#e3e9f1] px-3 text-xs font-medium text-[#344761] transition hover:border-[#a9bad2] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#2458d3]" key={base.key}>
                  <input
                    className="size-4 accent-[#2458d3]"
                    type="checkbox"
                    checked={visibleBaseKeys.includes(base.key)}
                    onChange={() => toggleBase(base.key)}
                  />
                  {base.name}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mb-[14px] flex items-center justify-between gap-3">
            <h2 className="m-0 text-[15px] font-bold text-[#172b4d]">Same value, different bases</h2>
            <span className="text-[9px] font-bold tracking-[1.1px] text-[#71819a]">{visibleBases.length} SHOWN</span>
          </div>

          <div className="space-y-3" aria-live="polite" aria-atomic="true">
            {visibleBases.length ? visibleBases.map((base) => (
              <article className={`min-w-0 rounded-[10px] border border-[#e3e9f1] border-l-[3px] p-4 ${base.key === 'decimal' ? 'border-l-[#e8aa42]' : base.key === 'binary' ? 'border-l-[#4381e6]' : base.key === 'octal' ? 'border-l-[#37a88d]' : 'border-l-[#9170d7]'}`} key={base.key}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="m-0 text-sm font-bold text-[#172b4d]">{base.name}</h3>
                  <span className="whitespace-nowrap rounded-[5px] bg-[#f1f4f8] px-2 py-1 text-[9px] font-bold tracking-wide text-[#566881]">BASE {base.radix}</span>
                </div>
                <p className="my-3 wrap-anywhere font-mono text-[clamp(24px,6vw,30px)] font-semibold leading-tight tabular-nums text-[#172b4d]">
                  {isValid ? numericValue.toString(base.radix).toUpperCase() : '—'}
                  <span className="ml-0.5 text-base font-medium text-[#2458d3]">{base.subscript}</span>
                </p>
                <p className="m-0 text-xs leading-snug text-[#63728a]">{base.hint}</p>
              </article>
            )) : (
              <p className="m-0 rounded-lg border border-dashed border-[#cdd7e5] p-4 text-sm text-[#63728a]">Select one or more bases to see their conversions.</p>
            )}
          </div>
        </div>

        <aside className="mt-[17px] flex items-start gap-3 rounded-[10px] border border-[#e7edf5] bg-[#f5f8fc] p-[13px] sm:p-[15px_18px]">
          <span className="grid size-[19px] shrink-0 place-items-center rounded-full border border-[#9aafd0] font-serif text-xs font-bold italic text-[#506b91]" aria-hidden="true">i</span>
          <p className="m-0 text-xs leading-relaxed text-[#4f6078]"><strong className="text-[#172b4d]">What changes?</strong> The number stays the same; only the symbols change. The small number beside each result tells you which base it uses.</p>
        </aside>
      </section>

      <footer className="mt-auto flex min-h-[58px] items-center justify-between border-t border-[#e3e9f1] text-[8px] font-bold tracking-[0.6px] text-[#75839a] sm:min-h-16 sm:text-[9px] sm:tracking-[1px]">
        <span>BASEWISE <span aria-hidden="true">·</span> A SIMPLE STUDY TOOL</span>
        <span>CHOOSE A BASE · EXPLORE THE CONVERSIONS</span>
      </footer>
    </main>
  )
}

export default App
