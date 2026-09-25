---
description: 'Rules for src/layout and the src root: page furniture and app shell wiring'
applyTo: 'src/layout/**, src/main.tsx, src/index.css'
---

# layout/ — page furniture

The parts of the page that are not the converter and not a breakdown: the header, the
"how to use" details, and the status line. Shared principles and repo-wide layout, types,
styling, and accessibility rules live in `src.instructions.md`; `.tsx`-specific component
guidance lives in `react-typescript.instructions.md`.

## What belongs here

- `PageHeader.tsx` — the skip-level `basewise` link and the tagline.
- `HelpDetails.tsx` — the collapsed "How to use" copy.
- `StatusLine.tsx` — the live region that reports the current reading or an error.

Also covered by this file:

- `src/main.tsx` — the React root. Mounts `App` into `#root` and imports `index.css`.
  Nothing else: no state, no routing, no listeners.
- `src/index.css` — Tailwind's `@import`, the `@theme` design token block, and any
  genuinely global CSS (the display and mono font stacks, the focus-visible defaults, the
  `prefers-reduced-motion`, `prefers-contrast`, and `forced-colors` blocks). Component
  styling lives in the component, not here.

## Rules

- **Keep the status line a single live region.** It is `role="alert"` for an error and
  `role="status"` otherwise, always with `id="edit-status"`. Do not add a second one, do not
  swap the role by rendering two elements, and do not move the error into a toast.
- Colour never carries state alone: the copy always says what happened, so the message must
  stay meaningful as plain text.
- Page furniture holds no domain logic and never touches `core/` value math. `StatusLine`
  takes no message prop: it renders its `children` and only switches `role`/colour on the
  `isError` boolean. `core/display.ts` (`statusFor`) produces the `message`/`error` strings,
  and `App.tsx` passes them on as children plus `isError={error !== ''}`.
- No component here reads or writes app state. If one needs data, it arrives as props from
  `App.tsx`.
- Keep semantic HTML — `header`, `a`, `details`, `summary`, `p` — so the page keeps its
  landmarks. Utilities style; they do not excuse a `div`.
- `main.tsx` stays a single `createRoot(...).render(...)` call, and every global CSS rule in
  `index.css` must apply to the whole document. If a rule styles one component, it belongs
  in that component (DRY).
- **Design tokens live in the `@theme` block in `src/index.css`** — colour, the font stacks,
  and the surfaces. Tailwind 4 turns each one into a utility (`bg-paper-3`, `text-ink-soft`,
  `border-rule`, `font-display`, `outline-focus`, …), so no component needs an ad-hoc hex
  value. The three preference media blocks live there too, unlayered so they beat Tailwind
  utilities; extend them when page furniture gains a new colour or state cue.
- Page furniture is the worksheet chrome: the masthead's double rule, the boxed section
  header bar, the inset status readout with its 3px left rule, and the bracketed help note
  bar. Keep `HelpDetails`'s summary label wrapped in its own `<span>How to use</span>` —
  the specs match that text exactly.
- Leave `src/vite-env.d.ts` alone: it is Vite's ambient declaration, not application code.

## Checks

Run the checks in `src.instructions.md`.
