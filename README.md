# Base Converter

A simple, live number-base converter for learning how the same whole number is written in different bases.

## Run locally

```sh
npm install
npm run dev
```

Open the URL Vite prints (including `/base-converter/`). If another dev server is already running, Vite may choose a different port; use `npm run dev -- --port 5174 --strictPort` to require a specific one. The dev server polls for file changes so edits made on Windows still trigger hot reload when Vite runs under WSL against `/mnt/c`. Install dependencies in the same environment where you run Vite: Windows and WSL need different native packages in `node_modules`. Restart an already-running dev server after changing its config.

Decimal, binary, octal, and hexadecimal rows are shown on load, in that order. Entering a number and reading it back happen in the same place: each row has exactly one writable box, its rightmost units place, and typing there makes that row the base you are writing in while every other row rewrites itself live. The Bit width slider starts at 16 bits and snaps to 8, 16, or 32 bits; switching widths preserves the current number, and widths too small to hold it are marked unavailable. Drag the thumb or focus the slider and use the arrow keys, Home, or End to change widths. The source row is marked by a solid ink bar down the left edge of its base cell, and its header cell carries a `data-source` attribute; the status strip also names the base in words. The writable units box is visually distinct with a 2px frame mixed from that row's base accent with ink, plus a light tint of the same accent, and a heavier rule along its bottom edge, so it reads as a worksheet cell you can write in rather than a printed readout. The remaining boxes in a row are read-only readouts of the same value: they show no text cursor, take no focus on hover or click, and never paint a focus frame, so each row contributes a single Tab stop for typing. Each box holds one available place, numbered from zero at the units position and shown underneath; octal and hexadecimal places also show the binary bits combined into each digit. Click a base name to expand or collapse its row and see each non-zero digit's contribution and how those contributions add up to the shared decimal total, without crowding the converter. Use Show all breakdowns or Hide all breakdowns to expand or collapse every row at once. The keyboard steps the value too: with the caret in a row's units box, ↑ and ↓ move the number by one, and Page Up / Page Down move it by a whole place.

Each row shows only as many digit places as fit within the selected value limit. At the default 16-bit width this is five decimal, sixteen binary, six octal, and four hexadecimal places; 8- and 32-bit widths scale those counts to fit their unsigned limits. All rows fill the same width and all digit boxes share a height. Binary boxes occupy one bit-width track, octal boxes span their represented bits (three except for the partial leading group), and hexadecimal boxes span four, so their boundaries line up with the binary bit groups without overflowing. Each place is labeled with its position, and octal and hexadecimal labels also show the bits the digit represents. Decimal boxes divide the same width evenly. The table scrolls horizontally on narrow screens, and keeps a minimum width to keep digits readable; leading zeros fill the available places above the value. The selected width caps the value; exceeding it shows a "too large" notice while keeping the grid intact instead of showing a clipped or half-filled answer. Digits that are not valid for a row's base are rejected with an inline message, and an empty field is allowed — the first ↑ starts at 1 and the first ↓ stays at 0.

Octal and hexadecimal digit labels show the bits represented by each place, counting from the units bit on the right. Hovering or focusing one of these digits (or its breakdown term) highlights the corresponding binary boxes and labels. The highest octal digit covers only the remaining one or two bits when the selected width is not a multiple of three; the other octal places group three bits each. Hexadecimal places each group four bits.

## Visual language

The page is styled as a 1992 educational computer workbook, reimplemented cleanly for the web. The period supplies the structure, materials, framing, and ornament — heavy and double rules, a framed instrument panel, a ruled ledger, inset fields, a masthead mark — while the modern browser supplies the crisp rendering, contrast, and focus behaviour. It is light-only (`color-scheme: light`), loads nothing from the network at runtime, and adds no dependencies beyond the type stack.

Colour, type, and surface decisions live in one `@theme` block at the top of `src/index.css`, which Tailwind 4 turns into utilities (`bg-paper-3`, `text-ink-soft`, `border-rule`, `font-display`, `outline-focus`, …). Five surface tones carry five distinct roles, so the page reads as layered sheets rather than one flat fill:

| Token | Value | Role |
| --- | --- | --- |
| `--color-paper` | `#f5ecd6` | page surface — the desk |
| `--color-panel` | `#e8eae7` | cool grey-cream instrument panel surround |
| `--color-paper-2` | `#fdfaf0` | sheet surface — row surfaces and selected-cell tints |
| `--color-paper-3` | `#ded3ac` | band surface — table header, panel title bar, status strip, help control |
| `--color-well` | `#e9dfbd` | field surface — inset readouts, the instructional callout, the worked calculation |
| `--color-frame` | `#75683f` | panel and table frame edges |
| `--color-ink` | `#172b4d` | primary text |
| `--color-ink-soft` | `#4d5b71` | secondary text |
| `--color-rule` | `#b3a582` | meaningful hairline rules and the dotted ledger separators |
| `--color-rule-soft` | `#ddd4bd` | decorative separators and bevel highlights |
| `--color-focus` | `#2458d3` | focus ring |
| `--color-danger` | `#a52736` | error text |

Every text pair is measured, not assumed. `tests/contrast.spec.ts` reads the computed colours out of the running page and resolves each element's effective background by walking up the DOM, so moving an element onto a new surface re-measures it automatically rather than silently invalidating the claim. Ink measures 13.50:1 on the panel and 9.41:1 on the band; ink-soft measures 6.59:1 on the panel and 4.60:1 on the band. Ink-soft on the band is the tightest pair in the palette, so the band may not be darkened further.

Three rules follow from that layer. Faint, low-contrast values are for decorative rules only — never for text, because every text pair here is normal size and must clear 4.5:1. Per-base accents (defined in the `rows` array in `src/core/conversion.ts`) are decoration and tint only: a raw accent never serves as the sole boundary or state cue, which is why the writable box uses an accent-ink mix for its frame *and* for the heavier bottom rule that marks it as writable, and why every state also carries a shape cue — the source-row margin bar, the highlight rings, and the underlines on highlighted labels and breakdown terms. The writable box's bottom rule is painted as an inset `box-shadow` rather than a heavier bottom border, so the box keeps its measured 2px border width and exact geometry, and so it can share the one composed shadow that also carries the bevel and the highlight ring. And ornament is always `aria-hidden`, decorative, never the sole cue for a state or a boundary, never laid behind text, never a Tab stop, and removable without breaking layout or meaning. The allowed vocabulary is hairlines and double rules, coloured margin bars, hard offset shadows, inset bevels, small mono markers, and the one masthead monitor icon. Textures behind text, soft or glassy shadows, and gradients are not used.

The notation type — digits, positions, bit ranges, radices, equations, and the status strip — is set in **IBM Plex Mono**, self-hosted from `src/assets/fonts/` under the SIL Open Font License 1.1 (licence file included beside it). Nothing is fetched from a CDN; the build fingerprints the three woff2 files into `dist/assets/`. The stack falls back through JetBrains Mono, Roboto Mono, DejaVu Sans Mono, `ui-monospace`, Cascadia Mono, Segoe UI Mono, Consolas, and Menlo. The `.mono-tech` utility also turns on slashed zero and tabular figures, so even a fallback face reads as machine print.

Changed readout digits roll briefly from top to bottom with a subtle accent tint that briefly marks the moving boxes; writable boxes stay still so typing remains steady. The stylesheet also answers three user preferences: `prefers-reduced-motion: reduce` drops the transitions and digit rolls, `prefers-contrast: more` flattens the tints and bevels to solid rules and ink borders, and `forced-colors: active` keeps the writable box and highlight rings visible with system colours.

## Project layout

`src/` is organized by feature folder:

| Folder | Contents |
| --- | --- |
| `src/core/` | The rules, in plain TypeScript. `conversion.ts` — the value math, digit alphabet, and base definitions. `entry.ts` — the entry state machine. `display.ts` — the derived page data. `focus.ts` — where Tab goes next. No React, no DOM. |
| `src/digits/` | The digit-entry feature: the scrolling table, one row per base, one box per place, and the base header. |
| `src/breakdown/` | The place-value breakdown shown under an expanded row. |
| `src/layout/` | Page furniture: the header, the "how to use" details, the status line, and the site footer with author credit and GitHub link. |
| `src/App.tsx` | Page structure: it holds the state, wires the features together, and turns a focus target into a real node. |

## Checks

```sh
npm run typecheck
npm run lint
npm run build
```

Run the unit suite for the `src/core/` rules with:

```sh
npm run test:unit
```

Run the browser interaction suite in Chromium and Firefox with:

```sh
npx playwright install chromium firefox
npm run test:e2e
```

Pull requests run both suites: the
[Check Playwright tests](.github/workflows/check-playwright-test.yml) workflow executes
`npm run test:unit` and then `npm run test:e2e`.

## Deployment

Pushing to `main` triggers the [Deploy to GitHub Pages](.github/workflows/deploy-pages.yml)
workflow, which builds the app and publishes `dist` to
<https://lfarci.github.io/base-converter/>. The workflow can also be run manually from the
Actions tab.

Because Pages serves the site from the `/base-converter/` subpath, `base` is set to
`/base-converter/` in `vite.config.ts`.
