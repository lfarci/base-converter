---
description: 'React component best practices for tiny, reusable function components'
applyTo: '**/*.tsx'
---

# React + TypeScript

`.tsx`-specific guidance. Shared principles, layout, types, styling, and accessibility
rules live in `src.instructions.md`. Adapted from
[Awesome GitHub Copilot](https://awesome-copilot.github.com/).

## Tiny reusable components

- One component, one responsibility. If a component needs a paragraph to explain what it
  does, split it.
- Extract a component when it is reused, or when extraction makes the parent's render
  readable. Do not extract for a single call site just to look modular (KISS).
- Share behaviour through props and small pure helpers, not inheritance or render-prop
  pyramids. A presentational component receives data and callbacks and holds no domain
  logic.
- Props are explicit and minimal: only what the component renders or forwards. No prop that
  is always the same value at every call site (YAGNI).
- Prefer composition over configuration: pass children/elements instead of adding mode
  flags.
- Keep pure, non-React logic in a `.ts` module so it can be tested without rendering.
- Name props for their meaning (`value`, `onChange`), not their implementation
  (`data`, `setterFn`).
- Declare props with a local `type XProps = { ... }` and type event handlers with React's
  own types (`KeyboardEvent<HTMLInputElement>`).

## React 19

- Function components and hooks only — no class components.
- Hooks at the top level, never in conditions or loops.
- State holds only what cannot be derived. Compute derived values during render instead of
  mirroring them into state with an effect.
- Effects are for synchronizing with things outside React (DOM listeners, timers,
  third-party APIs). Do not use an effect to transform props into state.
- `useRef` for values that survive renders without causing one; `useState` when the UI must
  react.
- Stable identity: pass a pre-built callback rather than creating one inline when a child
  relies on referential equality.
- Keys must be stable and derived from data, never array indices in reorderable lists.
- `react/only-export-components` warns by default: a module exporting a component should
  not also export unrelated values. Put shared values in `core/`.
- `react/rules-of-hooks` is an error — never work around it.

## Tailwind in components

- Compose classes directly in JSX. Extract a repeated class cluster into a small component
  or a shared token before it is copy-pasted a third time.
- Use responsive and state variants in the markup (`sm:`, `hover:`, `focus-visible:`)
  rather than conditional JavaScript.
