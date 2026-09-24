# Basewise

A simple, live number-base converter for learning how the same whole number is written in different bases.

## Run locally

```sh
npm install
npm run dev
```

Decimal, binary, octal, and hexadecimal rows are shown on load. Entering a number and reading it back happen in the same place: type directly into the digit boxes of any row, and that row becomes the base you are writing in (marked **source**) while every other row rewrites itself live. Each box holds one position, and the position's index is printed underneath it, so the rightmost box is always the units digit. The keyboard steps the value too: with the caret in a box, ↑ and ↓ move the number by one, and Page Up / Page Down move it by a whole place.

Every row always shows the same sixteen positions, so you can read the whole grid at once: the value sits in the low places and the unused high places are filled with leading zeros. Sixteen binary positions hold at most `65535`, and binary is the row a value needs the most places in, so that is the cap for the page — go above it and the row keeps its grid and shows a "too large" notice instead of a clipped or half-filled answer. Digits that are not valid for a row's base are rejected with an inline message, and an empty field is allowed — the first ↑ starts at 1 and the first ↓ stays at 0. Because the places never move, writing in one box changes only that position's digit, and the leading zeros the grid shows are never part of the number itself.

Octal and hexadecimal are shown with a decorative grouping underneath their own digit boxes: the bits of the number split into threes under the octal row and fours under the hexadecimal row, so you can see why three bits make one octal digit and four bits make one hex digit. The grouping is derived from the sixteen positions of the binary row, so at rest it shows six octal groups and four hex groups, and it counts from the right — the leading group may be short, and it is drawn as dimmed dashed placeholders rather than padding the value with zeros. They are decoration only: nothing in them is focusable, and the digits themselves stay the value you read and type.

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
