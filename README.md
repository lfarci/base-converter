# Basewise

A simple, live number-base converter for learning how the same whole number is written in different bases.

## Run locally

```sh
npm install
npm run dev
```

Decimal, binary, octal, and hexadecimal rows are shown on load. Entering a number and reading it back happen in the same place: type directly into the digit boxes of any row, and that row becomes the base you are writing in (marked **source**) while every other row rewrites itself live. Each box holds one position, and the position's index is printed underneath it, so the rightmost box is always the units digit.

Use **Add another base** to add a row for any base from 2 to 36 (digits `0-9`, then `A-Z`). Added rows can be removed again; the four rows shown on load stay put.

Use the **Digit width** selector to read a value as a fixed-width register. **Auto** (the default) shows only the positions a value needs, so rows change width as you type. **32-bit** and **64-bit** pad every row with leading zeros up to the positions that width occupies in its base — 32 binary boxes, 8 hex digits, 10 decimal digits, or 11 octal digits for a 32-bit word, and 64 / 16 / 20 / 22 for a 64-bit word. Those counts are derived from `2^width - 1` in the row's base, not hardcoded. The number itself never changes, only how it is padded (the row you are typing in keeps its natural length so the boxes do not shift under the caret). With a fixed width selected, a value that no longer fits in the word is reported as too large for that width; Auto keeps the `Number.MAX_SAFE_INTEGER` accuracy limit. Digits that are not valid for a row's base are rejected with an inline message, and whole numbers above that accuracy limit show a "too large to convert accurately" notice instead of a wrong answer.

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
