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

test('leading padding zeroes recede while significant digits keep full ink', async ({ page }) => {
  const units = digit(page, 'Decimal', 10, 0)
  await units.focus()
  for (const key of '127') await page.keyboard.press(key)

  for (const position of [4, 3]) {
    const paddingZero = digit(page, 'Decimal', 10, position)
    await expect(paddingZero).toHaveValue('0')
    await expect(paddingZero).toHaveAttribute('data-padding-zero', 'true')
    await expect(paddingZero).toHaveCSS('color', 'rgb(77, 91, 113)')
    await expect(paddingZero).toHaveCSS('font-weight', '400')
  }

  for (const position of [2, 1, 0]) {
    const significantDigit = digit(page, 'Decimal', 10, position)
    await expect(significantDigit).not.toHaveAttribute('data-padding-zero', 'true')
    await expect(significantDigit).toHaveAttribute('data-significant', 'true')
    await expect(significantDigit).toHaveCSS('color', 'rgb(23, 43, 77)')
    await expect(significantDigit).toHaveCSS('font-weight', '700')
  }
})

test('zero remains prominent when it is the whole value', async ({ page }) => {
  const units = digit(page, 'Decimal', 10, 0)
  await units.focus()
  await page.keyboard.press('0')

  await expect(units).not.toHaveAttribute('data-padding-zero', 'true')
  await expect(units).toHaveAttribute('data-significant', 'true')
  await expect(units).toHaveCSS('color', 'rgb(23, 43, 77)')
  await expect(units).toHaveCSS('font-weight', '700')
  await expect(digit(page, 'Decimal', 10, 1)).toHaveAttribute('data-padding-zero', 'true')
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

test('the masthead uses the utility name and retains its positional-notation tagline', async ({ page }) => {
  await expect(page).toHaveTitle('Base Converter — One number, four bases')
  await expect(page.getByRole('link', { name: 'Base Converter', exact: true })).toBeVisible()
  const tagline = page.locator('header > div > span')
  await expect(tagline).toHaveText('positional notation, plainly')
  await expect(tagline).toHaveCSS('text-transform', 'uppercase')
})

test('the explanatory callout spans the converter panel content width', async ({ page }) => {
  const panel = page.locator('#result-title').locator('xpath=..')
  const explanation = panel.locator('#result-title + p')
  const [panelBox, explanationBox] = await Promise.all([panel.boundingBox(), explanation.boundingBox()])

  expect(panelBox).not.toBeNull()
  expect(explanationBox).not.toBeNull()
  expect(explanationBox!.width).toBeGreaterThan(panelBox!.width * 0.95)
})

test('the worksheet heading, help marker, monitor, and base labels keep their software hierarchy', async ({ page }) => {
  const rule = page.locator('#page-title + div[aria-hidden="true"]')
  await expect(rule).toHaveCSS('height', '5px')
  await expect(rule.locator('span')).toHaveCount(2)
  await expect(rule.locator('span').first()).toHaveCSS('height', '3px')
  await expect(rule.locator('span').last()).toHaveCSS('height', '1px')

  const summary = page.locator('details > summary')
  await expect(summary).toContainText('How to use')
  const helpMarker = summary.locator('[aria-hidden="true"]')
  await expect(helpMarker).toHaveText('?')
  await expect(helpMarker).toHaveCSS('width', '20px')
  await expect(helpMarker).toHaveCSS('height', '20px')
  await expect(helpMarker).toHaveCSS('border-top-width', '2px')
  await expect(helpMarker).toHaveCSS('border-radius', '0px')

  const monitor = page.locator('header svg[aria-hidden="true"]')
  await expect(monitor).toHaveAttribute('viewBox', '0 0 28 28')
  await expect(monitor.locator('rect')).toHaveCount(4)
  await expect(monitor).toHaveCSS('width', '28px')
  await expect(monitor).toHaveCSS('height', '28px')

  for (const base of ['Decimal', 'Binary', 'Octal', 'Hexadecimal']) {
    const toggle = page.getByRole('button', { name: `Toggle ${base} place-value breakdown` })
    await expect(toggle).toHaveAttribute('title', `Click to open the ${base.toLowerCase()} place-value breakdown`)
    const baseName = toggle.locator('span').first()
    const radix = toggle.locator('xpath=../span[last()]')
    await expect(radix).toHaveCSS('font-size', '10px')
    const [nameSize, radixSize] = await Promise.all([
      baseName.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
      radix.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
    ])
    expect(nameSize, `${base} name should read larger than its radix`).toBeGreaterThan(radixSize)
  }

  const baseGrid = page.locator('th[scope="row"] > span').first()
  await expect(baseGrid).toHaveClass(/grid-cols-\[8px_minmax\(0,1fr\)_20px\]/)
  const marker = baseGrid.locator(':scope > span').first()
  await expect(marker).toHaveCSS('width', '7px')
  await expect(marker).toHaveCSS('height', '7px')
  await expect(marker).toHaveCSS('border-top-width', '1px')
  await expect(marker).toHaveCSS('border-radius', '0px')
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
