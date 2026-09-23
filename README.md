# Basewise

A simple, live number-base converter for learning how the same whole number is written in decimal, binary, octal, and hexadecimal.

## Run locally

```sh
npm install
npm run dev
```

Choose decimal, binary, octal, or hexadecimal as the starting base, then enter a non-negative whole number to see its representations update as you type. Use the checkboxes to choose which result bases are shown. Switching the starting base preserves the number's value when the current input is valid.

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
