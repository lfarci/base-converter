# Basewise

A simple, live number-base converter for learning how the same whole number is written in different bases.

## Run locally

```sh
npm install
npm run dev
```

Open the URL Vite prints (including `/base-converter/`). If another dev server is already running, Vite may choose a different port; use `npm run dev -- --port 5174 --strictPort` to require a specific one. The dev server polls for file changes so edits made on Windows still trigger hot reload when Vite runs under WSL against `/mnt/c`. Install dependencies in the same environment where you run Vite: Windows and WSL need different native packages in `node_modules`. Restart an already-running dev server after changing its config.

Decimal, binary, octal, and hexadecimal rows are shown on load, in that order. Entering a number and reading it back happen in the same place: each row has exactly one writable box, its rightmost units place, and typing there makes that row the base you are writing in (marked **source**) while every other row rewrites itself live. The writable units box is visually distinct with a stronger, darker border and a light tint in that row's base accent. The remaining boxes in a row are read-only readouts of the same value: they show no text cursor, take no focus on hover or click, and never paint a focus frame, so each row contributes a single Tab stop for typing. Each box holds one available place, numbered from zero at the units position and shown underneath; octal and hexadecimal places also show the binary bits combined into each digit. Expand any base row to see each non-zero digit's contribution and how those contributions add up to the shared decimal total, without crowding the converter. The units place is always at the right. The keyboard steps the value too: with the caret in a row's units box, ↑ and ↓ move the number by one, and Page Up / Page Down move it by a whole place.

Each row shows only as many digit places as fit within the 16-bit value limit: five decimal, sixteen binary, six octal, and four hexadecimal. All rows fill the same width and all digit boxes share a height. Binary boxes occupy one bit-width track, octal boxes span their represented bits (three except for the leading one-bit digit), and hexadecimal boxes span four, so their boundaries line up with the binary bit groups without overflowing. Each place is labeled with its position, and octal and hexadecimal labels also show the bits the digit represents. Decimal boxes divide the same width evenly. The table keeps a 768px minimum width so boxes remain readable on narrow screens, where the table scrolls horizontally; leading zeros fill the available places above the value. Sixteen binary positions hold at most `65535`, and binary is the row a value needs the most places in, so that is the cap for the page — go above it and the grid stays intact with a "too large" notice instead of a clipped or half-filled answer. Digits that are not valid for a row's base are rejected with an inline message, and an empty field is allowed — the first ↑ starts at 1 and the first ↓ stays at 0.

Octal and hexadecimal digit labels show the bits represented by each place, counting from the units bit on the right. Hovering or focusing one of these digits (or its breakdown term) highlights the corresponding binary boxes and labels. The highest octal digit covers only bit 15, since sixteen is not a multiple of three; the other octal places group three bits each. Hexadecimal places each group four bits.

## Checks

```sh
npm run typecheck
npm run lint
npm run build
```

Run the browser interaction suite in Chromium and Firefox with:

```sh
npx playwright install chromium firefox
npm run test:e2e
```

## Deployment

Pushing to `main` triggers the [Deploy to GitHub Pages](.github/workflows/deploy-pages.yml)
workflow, which builds the app and publishes `dist` to
<https://lfarci.github.io/base-converter/>. The workflow can also be run manually from the
Actions tab.

Because Pages serves the site from the `/base-converter/` subpath, `base` is set to
`/base-converter/` in `vite.config.ts`.
