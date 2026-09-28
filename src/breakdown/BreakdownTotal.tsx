type BreakdownTotalProps = {
  contributions: bigint[]
  total: bigint
}

// The same contributions added back up to the value, so the breakdown reads as one sum.
export function BreakdownTotal({ contributions, total }: BreakdownTotalProps) {
  return (
    <span
      className="mono-tech border-l border-rule pl-4 font-semibold text-ink"
      role="math"
      aria-label={`${contributions.map((contribution) => contribution.toLocaleString('en-US')).join(' plus ')} equals ${total.toLocaleString('en-US')}`}
    >
      {contributions.map((contribution, index) => (
        <span key={`${index}-${contribution}`}>
          {index > 0 && <span aria-hidden="true"> + </span>}
          {contribution.toLocaleString('en-US')}
        </span>
      ))} <span aria-hidden="true">→</span> {total.toLocaleString('en-US')}
    </span>
  )
}
