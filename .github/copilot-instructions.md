# Basewise — Copilot Instructions

## What this is

"Basewise" is a small React + Vite + Tailwind single-page study tool that shows one whole
number written in decimal, binary, octal, and hexadecimal. It is a static site with no
backend, no API calls, and no persistence.

## Stack

- React 19 with function components and hooks only (no class components).
- TypeScript, compiled with `tsc -b` using `tsconfig.app.json`.
- Vite 8 for dev/build, Tailwind CSS 4 via `@tailwindcss/vite` (no `tailwind.config.js`).
- oxlint for linting (`.oxlintrc.json`).

## Commands

```sh
npm ci                # install exactly what package-lock.json pins
npm run dev           # dev server, served under /base-converter/
npm run typecheck     # tsc -b
npm run lint          # oxlint
npm run build         # tsc -b && vite build
```

There is no test framework. Validate a change with `npm run typecheck`, `npm run lint`,
and `npm run build`, plus a manual check in the browser for anything that affects
rendering.

## Architecture

Keep the app split by responsibility — do not let business logic creep back into JSX.

| Path | Responsibility |
| --- | --- |
| `src/bases.ts` | Base definitions (radix, digits, prefix, pattern, accent) and pure formatting/cap helpers. This is the single source of truth for the supported bases. |
| `src/validation.ts` | Pure, side-effect-free input handling: `validateNumber` (parse + validate) and `clampToMaxDigits` (bound oversized typing/pasting). |
| `src/useConverter.ts` | `useConverter` hook: owns `useState` state and translates component events into calls on the pure helpers. |
| `src/components/` | Presentational components. They receive data via props, render JSX, and hold no domain logic. |
| `src/App.tsx` | Composition only: call `useConverter`, derive `visibleBases`, arrange the components. |

Rules that follow from this:

- Pure logic (parsing, validation, formatting, clamping) belongs in `bases.ts` or
  `validation.ts` and must not import React.
- State and event handlers belong in `useConverter.ts`.
- Components are props-in / JSX-out. Do not compute conversions inside them.
- Add a new base by editing the `bases` array in `src/bases.ts` only. Nothing else
  should hard-code a radix, digit set, or prefix.

## Conventions

- **KISS**: prefer the direct solution. No abstractions with a single call site, no
  configuration layers, no state that can be derived during render.
- **DRY**: define each base's metadata, digit rules, and styling accent once in
  `src/bases.ts`. Never duplicate a radix or a digit pattern into a component.
- Strict TypeScript is on: `noUnusedLocals`, `noUnusedParameters`, and
  `verbatimModuleSyntax`. Import types with `import type { ... }` / inline `type`
  specifiers, and delete anything you stop using.
- `react/only-export-components` warns by default, so a module that exports a component
  should not also export unrelated values. Put shared values in a non-component module.
- Formatting: two-space indent, no semicolons, single quotes.
- `maxLength` must not be used on the number input. The cap is enforced in
  `clampToMaxDigits` because intermediate typing states (for example `1000…` in binary)
  legitimately exceed the digit count of the final value while still being valid.
- Conversions are capped at `Number.MAX_SAFE_INTEGER`; anything above it must show the
  "too large" message rather than a wrong result.

## UI, accessibility, and design

- Keep the existing visual language: light surface, `#2458d3` accent, `#172b4d` text,
  monospace for numeric output, and the per-base left border accent stored on each base.
- Every interactive control needs a label; the input's helper/error text is wired through
  `aria-describedby`, and errors also set `aria-invalid` and `role="alert"`.
- Do not rely on colour alone to convey state — error text is always present as words.
- Results are announced through `aria-live="polite"`.
- Long values must wrap instead of causing horizontal overflow (see `wrap-anywhere`).
- Any change to layout must still work at a 390 px viewport.

## Workflow

- Keep changes surgical and behaviour-preserving when refactoring; run the three
  validation commands above before considering the work done.
- Update `README.md` when user-visible behaviour, file layout, or commands change.
