import type { ReactNode } from 'react'

type StatusLineProps = {
  children: ReactNode
  isError: boolean
}

// The page's single live region: an error is announced as an alert, guidance as a status.
// The message is always words, never colour alone.
export function StatusLine({ children, isError }: StatusLineProps) {
  return (
    <p
      className={`mono-tech mx-3 mt-4 mb-3 border border-l-[3px] border-rule bg-paper-3 px-3 py-2 text-[13px] leading-relaxed ${isError ? 'border-l-danger text-danger' : 'border-l-ink text-ink'}`}
      id="edit-status"
      role={isError ? 'alert' : 'status'}
    >
      {children}
    </p>
  )
}
