type DoubleRuleProps = {
  className: string
}

export function DoubleRule({ className }: DoubleRuleProps) {
  return (
    <div aria-hidden="true" className={`flex h-[5px] flex-col justify-between ${className}`}>
      <span className="h-[3px] bg-ink" />
      <span className="h-px bg-rule" />
    </div>
  )
}
