import { bases, maxDigitsFor, type Base } from '../bases'

type BaseNumberInputProps = {
  base: Base
  value: string
  error: string
  onBaseChange: (key: string) => void
  onValueChange: (value: string) => void
}

export function BaseNumberInput({ base, value, error, onBaseChange, onValueChange }: BaseNumberInputProps) {
  const helperId = error ? 'input-error' : 'input-help'

  return (
    <div className="mx-auto mb-[27px] max-w-[420px] sm:mb-[34px]">
      <label className="mb-2 block text-sm font-semibold text-[#172b4d]" htmlFor="input-base">Convert from</label>
      <select
        className="mb-4 min-h-11 w-full rounded-[9px] border border-[#cdd7e5] bg-[#fbfcfe] px-3 text-sm font-medium text-[#172b4d] outline-none transition focus:border-[#2458d3] focus:ring-[3px] focus:ring-[#2458d3]/15"
        id="input-base"
        value={base.key}
        onChange={(event) => onBaseChange(event.target.value)}
      >
        {bases.map((option) => <option value={option.key} key={option.key}>{option.name} (base {option.radix})</option>)}
      </select>
      <label className="mb-[9px] block text-sm font-semibold text-[#172b4d]" htmlFor="number-input">Your {base.name} number</label>
      <div className={`flex min-h-[58px] items-center gap-3 rounded-[10px] border bg-[#fbfcfe] px-[17px] transition focus-within:border-[#2458d3] focus-within:ring-[3px] focus-within:ring-[#2458d3]/15 ${error ? 'border-[#bd3b46]' : 'border-[#cdd7e5]'}`}>
        <span className="font-mono text-[21px] font-bold text-[#2458d3]" aria-hidden="true">{base.radix}<sub className="text-xs">{base.radix}</sub></span>
        <input
          className="w-full min-w-0 border-0 bg-transparent font-mono text-[25px] font-semibold text-[#172b4d] outline-none"
          id="number-input"
          type="text"
          inputMode={base.radix === 16 ? 'text' : 'numeric'}
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          aria-describedby={helperId}
          aria-invalid={Boolean(error)}
        />
        <span className="text-[10px] font-bold tracking-[1.1px] text-[#8190a5]" aria-hidden="true">BASE</span>
      </div>
      <p className={`mt-[7px] min-h-5 text-xs leading-relaxed ${error ? 'text-[#a52736]' : 'text-[#63728a]'}`} id={helperId} role={error ? 'alert' : undefined}>
        {error || `Use digits ${base.digits}, up to ${maxDigitsFor(base.radix)} digits. Conversions update as you type.`}
      </p>
    </div>
  )
}
