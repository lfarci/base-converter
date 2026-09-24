import { bases } from './bases'
import { BaseNumberInput } from './components/BaseNumberInput'
import { BaseToggleList } from './components/BaseToggleList'
import { ConversionResults } from './components/ConversionResults'
import { Footer, Header, InfoNote } from './components/Chrome'
import { useConverter } from './useConverter'

function App() {
  const {
    input,
    inputBase,
    visibleBaseKeys,
    value,
    error,
    changeInput,
    changeInputBase,
    toggleBase,
  } = useConverter()
  const visibleBases = bases.filter(({ key }) => visibleBaseKeys.includes(key))

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 text-[#172b4d] sm:px-8">
      <Header />

      <section className="mx-auto mb-14 mt-11 w-full max-w-[760px] sm:mb-20 sm:mt-16" id="top" aria-labelledby="page-title">
        <div className="mb-7 text-center sm:mb-[38px]">
          <p className="mb-[18px] inline-flex items-center gap-[9px] text-[11px] font-bold tracking-[1.5px] text-[#2458d3]">
            <span className="size-[7px] rounded-full bg-[#51b99a] shadow-[0_0_0_4px_#e6f5f0]" aria-hidden="true" />
            NUMBER SYSTEMS · 01
          </p>
          <h1 className="text-[clamp(36px,6vw,54px)] font-bold leading-[1.08] tracking-[-2.3px] text-[#172b4d]" id="page-title">
            One number.<br /><span className="text-[#2458d3]">Four ways to see it.</span>
          </h1>
          <p className="mx-auto mt-[18px] max-w-[440px] text-sm leading-[1.65] text-[#63728a] sm:text-base">
            Choose a starting base, then watch the same number transform across number systems.
          </p>
        </div>

        <div className="rounded-[13px] border border-[#e3e9f1] bg-white p-4 shadow-[0_16px_44px_rgb(25_48_86_/_7%)] sm:rounded-2xl sm:p-[30px]">
          <BaseNumberInput
            base={inputBase}
            value={input}
            error={error}
            onBaseChange={changeInputBase}
            onValueChange={changeInput}
          />

          <BaseToggleList visibleKeys={visibleBaseKeys} onToggle={toggleBase} />

          <ConversionResults visibleBases={visibleBases} value={value} />
        </div>

        <InfoNote />
      </section>

      <Footer />
    </main>
  )
}

export default App
