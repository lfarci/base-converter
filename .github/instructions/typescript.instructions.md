---
description: 'TypeScript module and Vite configuration best practices'
applyTo: '**/*.ts'
---

# TypeScript + Vite

`.ts`-specific guidance. Shared principles, layout, types, styling, and accessibility rules
live in `src.instructions.md`. Adapted from
[Awesome GitHub Copilot](https://awesome-copilot.github.com/).

## Modules

- Pure, framework-free logic belongs here and must not import React.
- Keep the source of truth for shared metadata in a single module so components read it
  rather than hard-code their own copy (DRY).
- No side effects at import time beyond what a module genuinely owns.
- Prefer explicit, named exports over default exports so renames stay mechanical.
- Prefer `readonly` data and pure functions over mutable module-level state.

## Vite

- `vite.config.ts` owns `base`, plugins, and dev-server settings — do not duplicate that
  configuration elsewhere.
- The app is served under `/base-converter/`; use relative paths inside the app.
- Keep dev-only settings (for example the polling watcher for WSL) in the Vite config, out
  of application code.
- Restart the dev server after changing Vite or TypeScript config.
