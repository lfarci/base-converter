import { expect, test, type Locator } from '@playwright/test'
import { digit } from './helpers'

// The revamp has to keep every state readable without relying on hue: the source row, the
// writable cell, and the three highlight relationships each carry a shape or weight cue.

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('the writable units box reads as a worksheet cell and the readouts do not', async ({ page }) => {
  const units = digit(page, 'Decimal', 10, 0)
  await expect(units).toHaveCSS('border-top-width', '2px')
  await expect(units).not.toHaveCSS('background-color', 'rgb(255, 255, 255)')

  const readout = digit(page, 'Decimal', 10, 4)
  await expect(readout).not.toHaveCSS('border-top-width', '2px')
  await expect(readout).toHaveCSS('cursor', 'default')
})

test('the source row carries data-source and a margin bar, and both follow the row you type in', async ({ page }) => {
  const sources = page.locator('th[scope="row"][data-source]')

  await expect(sources).toHaveCount(1)
  await expect(sources.locator('button')).toHaveText('Decimal')

  // A solid ink bar: a shape cue, so it reads in forced-colors where a tint would not.
  const bar = sources.locator(':scope > div')
  await expect(bar).toHaveCSS('width', '3px')
  await expect(bar).toHaveCSS('background-color', 'rgb(23, 43, 77)')

  const hexadecimalUnits = digit(page, 'Hexadecimal', 16, 0)
  await hexadecimalUnits.focus()
  await page.keyboard.press('A')

  await expect(page.locator('th[scope="row"][data-source] button')).toHaveText('Hexadecimal')
})

test('the page reads as layered sheets, not one flat fill', async ({ page }) => {
  const backgroundOf = (locator: Locator) => locator.evaluate((element) => getComputedStyle(element).backgroundColor)

  const pageTone = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)
  const panel = await backgroundOf(page.locator('#result-title').locator('xpath=..'))
  const band = await backgroundOf(page.locator('#result-title'))
  const field = await backgroundOf(digit(page, 'Decimal', 10, 4))

  // Four roles, four tones: page (the desk), panel (the sheet on it), band (table header,
  // title bar, status strip) and field (inset readouts). If two of these ever collapse to
  // the same colour the layered-sheet cue is gone, which is the whole point of the change.
  const tones = [pageTone, panel, band, field]
  expect(new Set(tones).size, `four distinct surfaces, got ${tones.join(' | ')}`).toBe(4)
})

test('the converter panel is framed with a heavier top edge and a hard offset shadow', async ({ page }) => {
  const panel = page.locator('#result-title').locator('xpath=..')

  const top = await panel.evaluate((element) => parseFloat(getComputedStyle(element).borderTopWidth))
  const sides = await panel.evaluate((element) => [
    parseFloat(getComputedStyle(element).borderLeftWidth),
    parseFloat(getComputedStyle(element).borderRightWidth),
    parseFloat(getComputedStyle(element).borderBottomWidth),
  ])
  expect(top).toBeGreaterThan(Math.max(...sides))

  // A printed frame cue: an offset with zero blur, never a modern soft shadow.
  const shadow = await panel.evaluate((element) => getComputedStyle(element).boxShadow)
  expect(shadow, `panel shadow: ${shadow}`).toMatch(/\d+px \d+px 0px 0px/)
})

test('a focused writable cell keeps its recessed bevel and highlight ring at the same time', async ({ page }) => {
  const units = digit(page, 'Decimal', 10, 0)
  await units.focus()
  await page.keyboard.press('1')
  await units.focus()
  // Let the focus transition settle so the sampled values are the end state.
  await page.waitForTimeout(400)

  await expect(units).toHaveAttribute('data-highlighted', 'true')

  // All four cues at once: the inset bevel, the highlight ring, the focus frame and the
  // focus outline. The ring and the bevel share one box-shadow, which is why the cell can
  // be both highlighted and focused — an inline shadow would have hidden the bevel.
  await expect(units).toHaveCSS('box-shadow', /inset/)
  await expect(units).toHaveCSS('box-shadow', /inset[\s\S]*0px 0px 0px 2px/)
  await expect(units).toHaveCSS('border-top-color', 'rgb(36, 88, 211)')
  await expect(units).toHaveCSS('outline-style', 'solid')
  await expect(units).toHaveCSS('outline-width', '3px')
  await expect(units).toHaveCSS('border-top-left-radius', '2px')
})

test('highlighting a place carries an underline on its label and breakdown term, not colour alone', async ({ page }) => {
  const decimalUnits = digit(page, 'Decimal', 10, 0)
  await decimalUnits.focus()
  for (const key of '123') await page.keyboard.press(key)
  await page.getByRole('button', { name: 'Toggle Decimal place-value breakdown' }).click()

  const tensDigit = digit(page, 'Decimal', 10, 1)
  const tensLabel = tensDigit.locator('xpath=..').locator('.place-value-label')
  const tensTerm = page.locator('#decimal-place-value-breakdown [data-breakdown-term][data-position="1"]')

  await tensDigit.hover()
  await expect(tensLabel).toHaveAttribute('data-highlighted', 'true')
  await expect(tensTerm).toHaveAttribute('data-highlighted', 'true')
  await expect(tensLabel).toHaveCSS('text-decoration-line', 'underline')
  await expect(tensTerm).toHaveCSS('text-decoration-line', 'underline')
  // The label's highlighted border is a boundary, so it is an accent-ink mix rather than the
  // raw accent. It must be asserted as *not transparent*: every label carries
  // `border-transparent`, which computes to `rgba(0, 0, 0, 0)`, so a loose `/rgb/` match is
  // satisfied by a border that is not painted at all.
  await expect(tensLabel).not.toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)')
  await expect(tensDigit).toHaveCSS('box-shadow', /rgb/)

  await page.mouse.move(0, 0)

  // And the other direction: highlighting a breakdown term marks its digit and label.
  const onesTerm = page.locator('#decimal-place-value-breakdown [data-breakdown-term][data-position="0"]')
  await onesTerm.hover()

  const onesDigit = digit(page, 'Decimal', 10, 0)
  await expect(onesDigit).toHaveAttribute('data-highlighted', 'true')
  await expect(onesTerm).toHaveCSS('text-decoration-line', 'underline')
  await expect(onesDigit).toHaveCSS('box-shadow', /rgb/)
})
