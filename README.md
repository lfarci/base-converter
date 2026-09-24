# Basewise

A simple, live number-base converter for learning how the same whole number is written in decimal, binary, octal, and hexadecimal.

## Run locally

```sh
npm install
npm run dev
```

Choose decimal, binary, octal, or hexadecimal as the starting base, then enter a non-negative whole number to see its representations update as you type. Use the checkboxes to choose which result bases are shown. Switching the starting base preserves the number's value when the current input is valid.

Input is capped at the largest value JavaScript converts exactly (`Number.MAX_SAFE_INTEGER`), so each base accepts at most as many digits as that value needs: 16 in decimal, 53 in binary, 18 in octal, and 14 in hexadecimal. Typing or pasting beyond that limit is blocked.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/bases.ts` | Base definitions (radix, digits, prefix, pattern, accent) and formatting/cap helpers. |
| `src/validation.ts` | Pure input handling: parse + validate a string for a base, and clamp oversized typing. |
| `src/useConverter.ts` | `useConverter` hook owning input state and wiring the pure helpers to the UI. |
| `src/components/` | Presentational components: `BaseNumberInput`, `BaseToggleList`, `ConversionResults`, `Chrome`. |
| `src/App.tsx` | Composes the hook and components; no business logic lives here. |

## Checks

```sh
npm run typecheck
npm run lint
npm run build
```

## Deployment

Pushing to `main` triggers the [Deploy to GitHub Pages](.github/workflows/deploy-pages.yml)
workflow, which builds the app and publishes `dist` to
<https://lfarci.github.io/base-converter/>. The workflow can also be run manually from the
Actions tab.

Because Pages serves the site from the `/base-converter/` subpath, `base` is set to
`/base-converter/` in `vite.config.ts`.
