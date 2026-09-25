import { expect, test, type Locator } from '@playwright/test'
import { digit } from './helpers'

// WCAG 2.2 AA, measured rather than assumed. Colours are read from the computed styles in
// the page; each element's effective background is resolved by walking up until a
// non-transparent background is found; the ratios are computed here in Node.

// Chromium and Firefox report plain colours as `rgb()` and `color-mix()` results as
// `color(srgb …)`, whose components are already 0–1 rather than 0–255.
const luminance = (colour: string) => {
  const channels = colour.match(/[\d.]+/g)!.slice(0, 3).map(Number)
  const [r, g, b] = channels.map((channel) => {
    const value = colour.startsWith('color(') ? channel : channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrast = (a: string, b: string) => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (high + 0.05) / (low + 0.05)
}

const sample = (locator: Locator) => locator.evaluate((element) => {
  const rising = (from: Element | null) => {
    let node = from
    let colour = 'rgba(0, 0, 0, 0)'
    while (node && colour === 'rgba(0, 0, 0, 0)') {
      colour = getComputedStyle(node).backgroundColor
      node = node.parentElement
    }
    return colour
  }
  const style = getComputedStyle(element)
  return {
    text: style.color,
    border: style.borderTopColor,
    outline: style.outlineColor,
    fill: rising(element),
    around: rising(element.parentElement),
  }
})

test('every documented text pair clears 4.5:1 and every boundary clears 3:1', async ({ page }) => {
  await page.goto('./')

  const text: Array<[string, Locator]> = [
    ['ink on paper (title)', page.locator('h1#page-title')],
    ['ink-soft on paper (intro)', page.locator('section[aria-labelledby="page-title"] > p').first()],
    ['ink-soft on paper (footer note)', page.locator('section > p').last()],
    ['ink on paper-3 (section header)', page.locator('#result-title')],
    ['ink-soft on paper-2 (panel guidance)', page.locator('#result-title + p')],
    ['ink on paper-3 (status strip)', page.locator('#edit-status')],
    ['ink on paper-3 (help label)', page.locator('details summary span').last()],
    ['ink-soft on paper-3 (help copy)', page.locator('details p')],
    ['ink-soft on paper-3 (column headers)', page.locator('th[scope="col"]').first()],
    ['ink on paper-2 (base name)', page.locator('th[scope="row"] button span').first()],
    ['ink-soft on paper-2 (radix)', page.locator('th[scope="row"] span > span').last()],
    ['ink-soft on paper-2 (place-value label)', page.locator('.place-value-label').first()],
  ]

  for (const [name, locator] of text) {
    const { text: colour, fill } = await sample(locator)
    expect(contrast(colour, fill), `${name}: ${colour} on ${fill}`).toBeGreaterThanOrEqual(4.5)
  }

  // The writable box's frame has to separate the cell from the row surface and from its own tint.
  const writable = await sample(digit(page, 'Decimal', 10, 0))
  expect(contrast(writable.border, writable.around), `writable frame outside: ${writable.border} on ${writable.around}`).toBeGreaterThanOrEqual(3)
  expect(contrast(writable.border, writable.fill), `writable frame inside: ${writable.border} on ${writable.fill}`).toBeGreaterThanOrEqual(3)

  // The source row's margin bar is a boundary, so it clears 3:1 against the row surface.
  const bar = await sample(page.locator('th[scope="row"][data-source] > div'))
  expect(contrast(bar.fill, bar.around), `source margin bar: ${bar.fill} on ${bar.around}`).toBeGreaterThanOrEqual(3)

  const units = digit(page, 'Decimal', 10, 0)
  await units.focus()
  // Let the focus transition settle so the sampled outline colour is the end state.
  await page.waitForTimeout(400)
  const ring = await sample(units)
  expect(contrast(ring.outline, ring.around), `focus ring: ${ring.outline} on ${ring.around}`).toBeGreaterThanOrEqual(3)
})
