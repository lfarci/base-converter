import { bases } from '../bases'

type BaseToggleListProps = {
  visibleKeys: string[]
  onToggle: (key: string) => void
}

export function BaseToggleList({ visibleKeys, onToggle }: BaseToggleListProps) {
  return (
    <fieldset className="mb-6 border-0 p-0">
      <legend className="mb-2 text-sm font-semibold text-[#172b4d]">Show bases</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {bases.map((base) => (
          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-[#e3e9f1] px-3 text-xs font-medium text-[#344761] transition hover:border-[#a9bad2] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#2458d3]" key={base.key}>
            <input
              className="size-4 accent-[#2458d3]"
              type="checkbox"
              checked={visibleKeys.includes(base.key)}
              onChange={() => onToggle(base.key)}
            />
            {base.name}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
