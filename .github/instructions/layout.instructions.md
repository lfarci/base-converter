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
- `src/index.css` — Tailwind's `@import` and any genuinely global CSS (focus-visible
  defaults, font stack). Component styling lives in the component, not here.

## Rules

- **Keep the status line a single live region.** It is `role="alert"` for an error and
  `role="status"` otherwise, always with `id="edit-status"`. Do not add a second one, do not
  swap the role by rendering two elements, and do not move the error into a toast.
- Colour never carries state alone: the copy always says what happened, so the message must
  stay meaningful as plain text.
- Page furniture holds no domain logic and never touches `core/` value math. `StatusLine`
  renders a message it is given; deciding whether that message is an error happens in
  `App.tsx` (via `errorForParsed`).
- No component here reads or writes app state. If one needs data, it arrives as props from
  `App.tsx`.
- Keep semantic HTML — `header`, `a`, `details`, `summary`, `p` — so the page keeps its
  landmarks. Utilities style; they do not excuse a `div`.
- `main.tsx` stays a single `createRoot(...).render(...)` call, and every global CSS rule in
  `index.css` must apply to the whole document. If a rule styles one component, it belongs
  in that component (DRY).
- Leave `src/vite-env.d.ts` alone: it is Vite's ambient declaration, not application code.

## Checks

Run the checks in `src.instructions.md`.
