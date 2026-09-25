---
description: 'React + Vite + Tailwind best practices for tiny, reusable function components'
applyTo: '**/*.{ts,tsx,js,jsx,css}'
---

# React + Vite + Tailwind

Best practices for this app's stack: React 19 function components, strict TypeScript
compiled by Vite, and Tailwind CSS 4 configured in CSS. Adapted from
[Awesome GitHub Copilot](https://awesome-copilot.github.com/).

## Principles

- **KISS**: prefer the direct solution. No abstraction with a single call site, no
  configuration layer, no state that can be derived during render.
- **DRY**: declare each rule, base definition, and design token exactly once, then reuse
  it. Duplicated values or branches are a bug waiting to drift apart.
- **YAGNI**: build only what the current requirement needs. No speculative props,
  options, variants, or "just in case" helpers — delete anything that stops being used.

## Tiny reusable components

- One component, one responsibility. If a component needs a paragraph to explain what it
  does, split it.
- Extract a component when it is reused, or when extraction makes the parent's render
  readable. Do not extract for a single call site just to look modular (KISS).
- Share behaviour through props and small pure helpers, not inheritance or render-prop
  pyramids. A presentational component receives data and callbacks and holds no domain
  logic.
- Props are explicit and minimal: only what the component renders or forwards. No prop
  that is always the same value at every call site (YAGNI).
- Prefer composition over configuration: pass children/elements instead of adding mode
  flags.
- Keep pure, non-React logic in a separate module so it can be unit tested without
  rendering.
- Name props for their meaning (`value`, `onChange`), not their implementation
  (`data`, `setterFn`).

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
  not also export unrelated values. Put shared values in a plain module.
- `react/rules-of-hooks` is an error — never work around it.

## TypeScript

- Strict mode is on (`noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`).
- Import types with `import type { ... }` or inline `type` specifiers.
- Delete imports, props, and helpers you stop using — the build fails on unused locals.
- Prefer small local types and unions over optional-everything shapes. Reach for
  discriminated unions when a value has distinct states.

## Tailwind CSS 4

- Configuration is CSS-first. No `tailwind.config.js` and no PostCSS config for Tailwind;
  the `@tailwindcss/vite` plugin plus `@import "tailwindcss";` is the whole setup.
- Keep the existing surface language: white surface, `#172b4d` text, `#2458d3` focus
  accent, per-base accent from `rows`, and monospace `tabular-nums` for digits.
- Reuse the same accent and spacing values across components instead of inventing near
  duplicates (DRY).
- Compose classes directly in JSX. Extract a repeated class cluster into a small component
  or a shared token before it is copy-pasted a third time.
- Only reach for `style={...}` for genuinely dynamic values (for example a per-base accent
  colour); static appearance belongs in classes.
- Use responsive and state variants in the markup (`sm:`, `hover:`, `focus-visible:`)
  rather than conditional JavaScript.
- Keep semantic HTML: tables, lists, `button`, `input`. Utilities style; they do not excuse
  a `div` where an element has meaning.

## Vite

- `vite.config.ts` owns `base`, plugins, and dev-server settings — do not duplicate that
  configuration elsewhere.
- The app is served under `/base-converter/`; use relative paths inside the app.
- Keep dev-only settings (for example the polling watcher for WSL) in the Vite config,
  out of component code.
- Restart the dev server after changing Vite or TypeScript config.

## Accessibility

- Do not rely on colour alone to convey state; state is always present as words too.
- Keep `aria-label`s describing base, radix, and position, and keep `title` on disabled
  controls.
- Interactive elements are `button`/`input`/`a`, not clickable `div`s.
- Maintain a sane tab order: one Tab stop per logical row, `tabIndex={0}` only on the
  control that should receive focus, `-1` for the rest.
- The status line is a single live region: `role="alert"` for errors, otherwise
  `role="status"`.
- Verify focus is visible: the global `:focus-visible` outline is part of the design.

## Checks

Run these before calling a change done:

```sh
npm run typecheck
npm run lint
npm run build
```
