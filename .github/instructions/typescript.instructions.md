---
description: 'TypeScript and Vite best practices for strict, side-effect-free modules'
applyTo: '**/*.ts'
---

# TypeScript + Vite

Best practices for this app's `.ts` files: strict TypeScript modules and the Vite
configuration. Adapted from [Awesome GitHub Copilot](https://awesome-copilot.github.com/).

## Principles

- **KISS**: prefer the direct solution. No abstraction with a single call site, no
  configuration layer, no state that can be derived at call time.
- **DRY**: declare each rule and constant exactly once, then reuse it. Duplicated values or
  branches are a bug waiting to drift apart.
- **YAGNI**: build only what the current requirement needs. No speculative exports,
  options, or "just in case" helpers — delete anything that stops being used.

## Types

- Strict mode is on (`noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`).
- Import types with `import type { ... }` or inline `type` specifiers.
- Delete exports, imports, and helpers you stop using — the build fails on unused locals.
- Prefer small local types and unions over optional-everything shapes. Reach for
  discriminated unions when a result has distinct states, then branch on the discriminant
  rather than re-deriving validity.
- Keep types close to the data they describe; export a type only when another module needs
  it.
- Prefer `readonly` data and pure functions over mutable module-level state.

## Modules

- One module, one responsibility. Pure, framework-free logic lives in plain `.ts` modules
  and must not import React.
- Keep the source of truth for shared metadata in a single module so components read it
  rather than hard-code their own copy (DRY).
- No side effects at import time beyond what a module genuinely owns.
- Prefer explicit, named exports over default exports so renames stay mechanical.

## Vite

- `vite.config.ts` owns `base`, plugins, and dev-server settings — do not duplicate that
  configuration elsewhere.
- The app is served under `/base-converter/`; use relative paths inside the app.
- Keep dev-only settings (for example the polling watcher for WSL) in the Vite config, out
  of application code.
- Restart the dev server after changing Vite or TypeScript config.

## Checks

Run these before calling a change done:

```sh
npm run typecheck
npm run lint
npm run build
```
