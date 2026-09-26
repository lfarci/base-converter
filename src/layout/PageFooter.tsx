function GitHubMark() {
  return (
    <svg aria-hidden="true" className="shrink-0" fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.16c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.57-.29-5.27-1.29-5.27-5.74 0-1.27.45-2.3 1.19-3.11-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.17 1.19a11 11 0 0 1 5.77 0c2.2-1.5 3.17-1.19 3.17-1.19.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.11 0 4.46-2.71 5.44-5.29 5.72.42.36.79 1.07.79 2.16v3.2c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .5z" />
    </svg>
  )
}

export function PageFooter() {
  return (
    <footer
      aria-label="Site information"
      className="mx-auto flex w-full max-w-[920px] flex-col gap-2 border-t-4 border-double border-ink px-4 py-4 text-[12px] leading-relaxed text-ink-soft sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <small>© {new Date().getFullYear()} Logan Farci</small>
      <a
        className="inline-flex min-h-11 w-fit items-center gap-2 text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
        href="https://github.com/lfarci/base-converter"
      >
        <GitHubMark />
        Source code on GitHub
      </a>
    </footer>
  )
}
