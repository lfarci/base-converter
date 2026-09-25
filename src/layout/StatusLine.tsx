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
      className={`mt-3 min-h-5 text-xs leading-relaxed ${isError ? 'text-[#a52736]' : 'text-[#63728a]'}`}
      id="edit-status"
      role={isError ? 'alert' : 'status'}
    >
      {children}
    </p>
  )
}
