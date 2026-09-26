import { expect, test } from '@playwright/test'
import { digit } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('place-value help stays concise and each row breakdown is collapsed by default', async ({ page }) => {
  await expect(page.getByRole('columnheader', { name: 'Digits and place values', exact: true })).toBeVisible()
  await expect(page.getByText('Choose an 8-, 16-, or 32-bit width below to set the maximum value.', { exact: false })).toBeVisible()

  const instructions = page.locator('details').filter({ has: page.getByText('How to use', { exact: true }) })
  await expect(instructions).not.toHaveAttribute('open', '')
  await instructions.locator('summary').click()
  await expect(instructions).toContainText('Type in the rightmost box of any row to use that base. The other rows update automatically.')
  await expect(instructions).toContainText('Open a row’s breakdown to see how each digit contributes to the value.')
  await expect(instructions).toContainText('Keyboard: ↑ / ↓ change the value by one. Backspace/Delete remove a digit.')

  for (const base of ['Hexadecimal', 'Decimal', 'Octal', 'Binary']) {
    const toggle = page.getByRole('button', { name: `Toggle ${base} place-value breakdown` })
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(toggle).toHaveCSS('border-top-width', '0px')
    await expect(toggle).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(toggle.locator(':scope > span:first-child > svg path')).toHaveAttribute('d', 'M3 1.5 10.5 6 3 10.5Z')
    await expect(page.getByRole('region', { name: `${base} place-value breakdown`, exact: true })).toHaveCount(0)
  }
  await expect(page.getByText('Show place-value breakdown', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Breakdown' })).toHaveCount(0)
})

test('width slider snaps with keyboard and pointer, and breakdowns toggle in bulk', async ({ page }) => {
  const slider = page.getByRole('slider', { name: 'Bit width' })
  const readout = page.locator('#selected-bit-width')

  await expect(slider).toHaveAttribute('aria-valuenow', '16')
  const selectedWidthLabel = slider.getByText('16', { exact: true })
  await expect(selectedWidthLabel).toHaveCSS('font-weight', '700')
  await expect(selectedWidthLabel).toHaveCSS('text-decoration-line', 'none')
  await expect(slider.getByText('8', { exact: true })).toHaveCSS('color', 'rgb(77, 91, 113)')
  await expect(page.locator('#width-guidance')).toContainText('Maximum: 65,535')
  await expect(page.getByText('Bit width', { exact: true })).toHaveCount(0)
  await expect(readout).toHaveCSS('min-width', '36px')
  await expect(readout).toHaveCSS('height', '32px')
  await expect(readout.locator('xpath=..')).toHaveCSS('column-gap', '2px')
  await expect(slider.locator('xpath=..')).toHaveCSS('column-gap', '4px')
  const thumb = slider.locator('[data-slider-thumb="true"]')
  await expect(slider).toHaveCSS('height', '56px')
  await expect(thumb.locator('span')).toHaveCSS('width', '32px')
  await expect(thumb.locator('span')).toHaveCSS('height', '32px')
  const channel = slider.locator('[data-slider-channel="true"]')
  await expect(channel).toHaveCSS('height', '32px')
  const thumbBounds = await thumb.locator('span').boundingBox()
  const channelBounds = await channel.boundingBox()
  const valueLabelBounds = await slider.getByText('16', { exact: true }).boundingBox()
  expect(thumbBounds).not.toBeNull()
  expect(channelBounds).not.toBeNull()
  expect(valueLabelBounds).not.toBeNull()
  if (!thumbBounds || !channelBounds || !valueLabelBounds) return
  expect(Math.abs(thumbBounds.y - channelBounds.y)).toBeLessThanOrEqual(1)
  expect(Math.abs(thumbBounds.height - channelBounds.height)).toBeLessThanOrEqual(1)
  expect(valueLabelBounds.y - (thumbBounds.y + thumbBounds.height)).toBeGreaterThanOrEqual(6)
  expect(channelBounds.x).toBeLessThanOrEqual(thumbBounds.x)
  expect(channelBounds.x + channelBounds.width).toBeGreaterThanOrEqual(thumbBounds.x + thumbBounds.width)
  const bulkButton = page.getByRole('button', { name: 'Show all breakdowns' })
  await expect(bulkButton).toHaveCSS('cursor', 'pointer')
  const guidanceBounds = await page.locator('#width-guidance').boundingBox()
  const buttonBounds = await bulkButton.boundingBox()
  const widthControlBounds = await slider.boundingBox()
  const controlGroupBounds = await slider.locator('xpath=..').boundingBox()
  const readoutBounds = await readout.boundingBox()
  const bitsLabelBounds = await page.getByText('bits', { exact: true }).boundingBox()
  const bulkButtonBounds = await bulkButton.boundingBox()
  const controlRowBounds = await bulkButton.locator('xpath=..').boundingBox()
  expect(guidanceBounds).not.toBeNull()
  expect(buttonBounds).not.toBeNull()
  expect(widthControlBounds).not.toBeNull()
  expect(controlGroupBounds).not.toBeNull()
  expect(channelBounds).not.toBeNull()
  expect(readoutBounds).not.toBeNull()
  expect(bitsLabelBounds).not.toBeNull()
  expect(bulkButtonBounds).not.toBeNull()
  expect(controlRowBounds).not.toBeNull()
  if (!guidanceBounds || !buttonBounds || !widthControlBounds || !controlGroupBounds || !channelBounds || !readoutBounds || !bitsLabelBounds || !bulkButtonBounds || !controlRowBounds) return
  expect(Math.abs((buttonBounds.y + buttonBounds.height / 2) - (channelBounds.y + channelBounds.height / 2))).toBeLessThanOrEqual(1)
  expect(Math.abs(readoutBounds.height - buttonBounds.height)).toBeLessThanOrEqual(1)
  expect(Math.abs((readoutBounds.y + readoutBounds.height / 2) - (channelBounds.y + channelBounds.height / 2))).toBeLessThanOrEqual(1)
  expect(Math.abs((bitsLabelBounds.y + bitsLabelBounds.height / 2) - (channelBounds.y + channelBounds.height / 2))).toBeLessThanOrEqual(1)
  expect(controlGroupBounds.x).toBeLessThan(buttonBounds.x)
  expect(controlGroupBounds.x + controlGroupBounds.width).toBeLessThan(buttonBounds.x)
  expect(Math.abs(controlRowBounds.x + controlRowBounds.width - 12 - bulkButtonBounds.x - bulkButtonBounds.width)).toBeLessThanOrEqual(1)
  expect(Math.abs(guidanceBounds.x - widthControlBounds.x)).toBeLessThanOrEqual(1)
  await expect(bulkButton).toHaveCSS('height', '32px')
  await expect(bulkButton.locator('xpath=..')).toHaveCSS('padding-top', '20px')
  await page.setViewportSize({ width: 390, height: 844 })
  const mobileButtonBounds = await bulkButton.boundingBox()
  const mobileGuidanceBounds = await page.locator('#width-guidance').boundingBox()
  const mobileSliderBounds = await slider.boundingBox()
  const mobileControlGroupBounds = await slider.locator('xpath=..').boundingBox()
  const mobileChannelBounds = await slider.locator('[data-slider-channel="true"]').boundingBox()
  const mobileReadoutBounds = await readout.boundingBox()
  const mobileBitsLabelBounds = await page.getByText('bits', { exact: true }).boundingBox()
  const mobileControlRowBounds = await bulkButton.locator('xpath=..').boundingBox()
  expect(mobileButtonBounds).not.toBeNull()
  expect(mobileGuidanceBounds).not.toBeNull()
  expect(mobileSliderBounds).not.toBeNull()
  expect(mobileControlGroupBounds).not.toBeNull()
  expect(mobileChannelBounds).not.toBeNull()
  expect(mobileReadoutBounds).not.toBeNull()
  expect(mobileBitsLabelBounds).not.toBeNull()
  expect(mobileControlRowBounds).not.toBeNull()
  if (!mobileButtonBounds || !mobileGuidanceBounds || !mobileSliderBounds || !mobileControlGroupBounds || !mobileChannelBounds || !mobileReadoutBounds || !mobileBitsLabelBounds || !mobileControlRowBounds) return
  expect(Math.abs((mobileButtonBounds.y + mobileButtonBounds.height / 2) - (mobileChannelBounds.y + mobileChannelBounds.height / 2))).toBeLessThanOrEqual(1)
  expect(Math.abs(mobileReadoutBounds.height - mobileButtonBounds.height)).toBeLessThanOrEqual(1)
  expect(Math.abs((mobileReadoutBounds.y + mobileReadoutBounds.height / 2) - (mobileChannelBounds.y + mobileChannelBounds.height / 2))).toBeLessThanOrEqual(1)
  expect(Math.abs((mobileBitsLabelBounds.y + mobileBitsLabelBounds.height / 2) - (mobileChannelBounds.y + mobileChannelBounds.height / 2))).toBeLessThanOrEqual(1)
  expect(mobileControlGroupBounds.x).toBeLessThanOrEqual(mobileSliderBounds.x)
  expect(mobileControlGroupBounds.x + mobileControlGroupBounds.width).toBeLessThan(mobileButtonBounds.x)
  expect(Math.abs(mobileControlRowBounds.x + mobileControlRowBounds.width - 12 - mobileButtonBounds.x - mobileButtonBounds.width)).toBeLessThanOrEqual(1)
  expect(Math.abs(mobileGuidanceBounds.x - mobileSliderBounds.x)).toBeLessThanOrEqual(1)
  expect(mobileButtonBounds.x + mobileButtonBounds.width).toBeLessThanOrEqual(390)
  expect(await thumb.evaluate((element) => getComputedStyle(element).transitionProperty)).toContain('transform')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(thumb).toHaveCSS('transition-property', 'none')
  await slider.focus()
  await page.keyboard.press('ArrowRight')
  await expect(slider).toHaveAttribute('aria-valuenow', '32')
  await expect(readout).toHaveText('32')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.keyboard.press('ArrowLeft')
  await expect(slider).toHaveAttribute('aria-valuenow', '16')

  const sliderBounds = await slider.boundingBox()
  expect(sliderBounds).not.toBeNull()
  if (!sliderBounds) return
  const startX = sliderBounds.x + 18
  const centerY = sliderBounds.y + sliderBounds.height / 2
  await page.mouse.move(startX, centerY)
  await page.mouse.down()
  await page.mouse.move(sliderBounds.x + sliderBounds.width - 18, centerY)
  await page.mouse.up()
  await expect(slider).toHaveAttribute('aria-valuenow', '32')
  await expect(readout).toHaveText('32')

  await page.getByRole('button', { name: 'Show all breakdowns' }).click()
  for (const base of ['Hexadecimal', 'Decimal', 'Octal', 'Binary']) {
    await expect(page.getByRole('button', { name: `Toggle ${base} place-value breakdown` })).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('region', { name: `${base} place-value breakdown`, exact: true })).toBeVisible()
  }

  await page.getByRole('button', { name: 'Hide all breakdowns' }).click()
  for (const base of ['Hexadecimal', 'Decimal', 'Octal', 'Binary']) {
    await expect(page.getByRole('button', { name: `Toggle ${base} place-value breakdown` })).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByRole('region', { name: `${base} place-value breakdown`, exact: true })).toHaveCount(0)
  }

  await page.getByRole('button', { name: 'Toggle Decimal place-value breakdown' }).click()
  await expect(page.getByRole('button', { name: 'Toggle Decimal place-value breakdown' })).toHaveAttribute('aria-expanded', 'true')
  await page.getByRole('button', { name: 'Show all breakdowns' }).click()
  await expect(page.getByRole('button', { name: 'Hide all breakdowns' })).toBeVisible()
  for (const base of ['Hexadecimal', 'Decimal', 'Octal', 'Binary']) {
    await expect(page.getByRole('button', { name: `Toggle ${base} place-value breakdown` })).toHaveAttribute('aria-expanded', 'true')
  }
})

test('breakdown disclosure rotates to show state and respects reduced motion', async ({ page }) => {
  const toggle = page.getByRole('button', { name: 'Toggle Decimal place-value breakdown' })
  const marker = toggle.locator('svg')
  await expect(marker).toHaveCSS('transition-duration', '0.24s')

  await toggle.click()
  await expect(marker).toHaveAttribute('data-expanded', 'true')
  await expect(marker).toHaveCSS('transform', 'matrix(0, 1, -1, 0, 0, 0)')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(marker).toHaveCSS('transition-duration', '0s')
  await toggle.click()
  await expect(marker).not.toHaveAttribute('data-expanded')
  await expect(marker).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
})

test('each base shows only its available places and bit groups', async ({ page }) => {
  const rows = [
    { name: 'Decimal', radix: 10, positions: 5, labelSpans: 1 },
    { name: 'Binary', radix: 2, positions: 16, labelSpans: 1 },
    { name: 'Octal', radix: 8, positions: 6, labelSpans: 2 },
    { name: 'Hexadecimal', radix: 16, positions: 4, labelSpans: 2 },
  ]

  for (const { name, radix, positions, labelSpans } of rows) {
    const digitRow = page.getByRole('row', { name: new RegExp(`^${name}`) })
    const placeLabels = digitRow.locator('.place-value-label')
    await expect(placeLabels).toHaveCount(positions)
    await expect(digitRow.locator('[data-digit="true"]:disabled')).toHaveCount(0)

    for (let index = 0; index < positions; index += 1) {
      const position = positions - 1 - index
      const input = digit(page, name, radix, position)
      await expect(input).toHaveValue('0')

      const label = placeLabels.nth(index)
      await expect(label.locator(':scope > span')).toHaveCount(labelSpans)
      await expect(label.locator(':scope > span').first()).toHaveText(String(position))
      await expect(label.locator('sup')).toHaveCount(0)
      if (labelSpans === 2) {
        await expect(label.locator(':scope > span').nth(1)).toContainText('bit')
      }
    }
  }

  await page.getByRole('button', { name: 'Toggle Hexadecimal place-value breakdown' }).click()
  const hexadecimalBreakdown = page.getByRole('region', { name: 'Hexadecimal place-value breakdown', exact: true })
  await expect(hexadecimalBreakdown).toContainText('0 = 0')
  await expect(page.getByRole('region', { name: 'Decimal place-value breakdown', exact: true })).toHaveCount(0)
  const hexadecimalToggle = page.getByRole('button', { name: 'Toggle Hexadecimal place-value breakdown' })
  await expect(hexadecimalToggle).toHaveAttribute('aria-expanded', 'true')
  const marker = hexadecimalToggle.locator(':scope > span:first-child > svg')
  await expect(marker).toHaveAttribute('data-expanded', 'true')
  await expect(marker.locator('path')).toHaveAttribute('d', 'M3 1.5 10.5 6 3 10.5Z')
  await expect(marker).toHaveCSS('transform', 'matrix(0, 1, -1, 0, 0, 0)')
})

test('digit rows share aligned edges and bit groups without overflowing', async ({ page }) => {
  for (const viewportWidth of [390, 1280]) {
    await page.setViewportSize({ width: viewportWidth, height: 844 })
    const rows = [
      { name: 'Decimal', radix: 10, positions: 5 },
      { name: 'Binary', radix: 2, positions: 16 },
      { name: 'Octal', radix: 8, positions: 6 },
      { name: 'Hexadecimal', radix: 16, positions: 4 },
    ]
    const measurements = []

    for (const { name, radix, positions } of rows) {
      const row = page.getByRole('row', { name: new RegExp(`^${name}`) })
      const grid = await row.locator('ol').boundingBox()
      const first = await digit(page, name, radix, positions - 1).boundingBox()
      const last = await digit(page, name, radix, 0).boundingBox()
      expect(grid).not.toBeNull()
      expect(first).not.toBeNull()
      expect(last).not.toBeNull()
      measurements.push({ name, grid: grid!, first: first!, last: last! })
      expect(Math.abs(first!.x - grid!.x)).toBeLessThan(1)
      expect(Math.abs(last!.x + last!.width - grid!.x - grid!.width)).toBeLessThan(1)
    }

    const binary = measurements[1]
    for (const row of measurements) {
      expect(Math.abs(row.grid.x - binary.grid.x)).toBeLessThan(1)
      expect(Math.abs(row.grid.width - binary.grid.width)).toBeLessThan(1)
      expect(Math.abs(row.first.height - binary.first.height)).toBeLessThan(1)
    }

    for (const { name, radix, positions, bits } of [
      { name: 'Octal', radix: 8, positions: 6, bits: 3 },
      { name: 'Hexadecimal', radix: 16, positions: 4, bits: 4 },
    ]) {
      for (let position = 0; position < positions; position += 1) {
        const group = await digit(page, name, radix, position).boundingBox()
        const lowBit = await digit(page, 'Binary', 2, position * bits).boundingBox()
        const highBit = await digit(page, 'Binary', 2, Math.min(15, position * bits + bits - 1)).boundingBox()
        expect(group).not.toBeNull()
        expect(lowBit).not.toBeNull()
        expect(highBit).not.toBeNull()
        expect(Math.abs(group!.x - highBit!.x)).toBeLessThan(1)
        expect(Math.abs(group!.x + group!.width - lowBit!.x - lowBit!.width)).toBeLessThan(1)
      }
    }
  }
})

test('base row toggles and radix labels align across rows', async ({ page }) => {
  for (const viewportWidth of [390, 1280]) {
    await page.setViewportSize({ width: viewportWidth, height: 844 })
    const rows = ['Decimal', 'Binary', 'Octal', 'Hexadecimal']
    const headers = []

    for (const name of rows) {
      const row = page.getByRole('row', { name: new RegExp(`^${name}`) })
      const toggle = await row.getByRole('button').boundingBox()
      const baseToggle = row.getByRole('button')
      const radix = await baseToggle.locator(':scope > span').nth(1).boundingBox()
      const disclosure = await baseToggle.locator('[aria-hidden="true"]').boundingBox()
      expect(toggle).not.toBeNull()
      expect(radix).not.toBeNull()
      expect(disclosure).not.toBeNull()
      expect(disclosure!.x + disclosure!.width + 4).toBeLessThan(radix!.x)
      headers.push({ toggle: toggle!, radix: radix! })
    }

    for (const header of headers.slice(1)) {
      expect(Math.abs(header.toggle.x - headers[0].toggle.x)).toBeLessThan(1)
      expect(Math.abs(header.radix.x - headers[0].radix.x)).toBeLessThan(1)
      expect(Math.abs(header.radix.width - headers[0].radix.width)).toBeLessThan(1)
    }
  }
})

test('base title and breakdown heading align with the digit grid at narrow and wide widths', async ({ page }) => {
  for (const viewportWidth of [390, 1280]) {
    await page.setViewportSize({ width: viewportWidth, height: 844 })
    const toggle = page.getByRole('button', { name: 'Toggle Decimal place-value breakdown' })
    const row = page.getByRole('row', { name: /^Decimal/ })
    const grid = await row.locator('ol').boundingBox()
    const title = await toggle.boundingBox()
    const digitBox = await digit(page, 'Decimal', 10, 0).boundingBox()
    expect(grid).not.toBeNull()
    expect(title).not.toBeNull()
    expect(digitBox).not.toBeNull()
    expect(Math.abs(title!.y + title!.height / 2 - digitBox!.y - digitBox!.height / 2)).toBeLessThan(3)
    await expect(row.locator('th')).toHaveCSS('width', '144px')

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const heading = await page.getByRole('region', { name: 'Decimal place-value breakdown', exact: true })
      .getByRole('heading', { name: 'Breakdown' })
      .boundingBox()
    expect(heading).not.toBeNull()
    expect(Math.abs(heading!.x - grid!.x)).toBeLessThan(1)
    await toggle.click()
  }
})

test('place-value breakdown shows non-zero digit terms and the decimal total', async ({ page }) => {
  const decimalUnits = digit(page, 'Decimal', 10, 0)
  await decimalUnits.focus()
  await page.keyboard.press('1')
  await page.keyboard.press('7')

  const examples = [
    { name: 'Decimal', terms: ['10 to the power of 1 times 1 equals 10', '10 to the power of 0 times 7 equals 7'], sum: '10 + 7 → 17' },
    { name: 'Binary', terms: ['2 to the power of 4 times 1 equals 16', '2 to the power of 0 times 1 equals 1'], sum: '16 + 1 → 17' },
    { name: 'Octal', terms: ['8 to the power of 1 times 2 equals 16', '8 to the power of 0 times 1 equals 1'], sum: '16 + 1 → 17' },
    { name: 'Hexadecimal', terms: ['16 to the power of 1 times 1 equals 16', '16 to the power of 0 times 1 equals 1'], sum: '16 + 1 → 17' },
  ] as const

  for (const { name, terms, sum } of examples) {
    await page.getByRole('button', { name: `Toggle ${name} place-value breakdown` }).click()
    const breakdown = page.getByRole('region', { name: `${name} place-value breakdown`, exact: true })
    await expect(breakdown.getByRole('heading', { name: 'Breakdown' })).toBeVisible()
    const equations = breakdown.getByRole('math')
    await expect(equations).toHaveCount(3)
    await expect(equations.nth(0)).toHaveAttribute('aria-label', terms[0])
    await expect(equations.nth(1)).toHaveAttribute('aria-label', terms[1])
    await expect(equations.last()).toHaveText(sum)
    const superscripts = breakdown.locator('sup')
    await expect(superscripts).toHaveCount(2)
    await expect(superscripts.nth(0)).toHaveText(name === 'Binary' ? '4' : '1')
    await expect(superscripts.nth(1)).toHaveText('0')
  }
})

test('clicking the base title toggles its breakdown and preserves focus', async ({ page }) => {
  const toggle = page.getByRole('button', { name: 'Toggle Decimal place-value breakdown' })
  await expect(toggle).toHaveCSS('cursor', 'pointer')
  await expect(toggle).toHaveAttribute('title', 'Click to open the decimal place-value breakdown')
  await toggle.click()
  await expect(toggle).toHaveAttribute('title', 'Click to close the decimal place-value breakdown')

  const breakdown = page.getByRole('region', { name: 'Decimal place-value breakdown', exact: true })
  await expect(breakdown.getByRole('heading', { name: 'Breakdown' })).toBeVisible()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(breakdown.getByRole('button')).toHaveCount(0)

  await page.getByRole('button', { name: 'Toggle Decimal place-value breakdown' }).click()
  await expect(breakdown).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Toggle Decimal place-value breakdown' })).toBeFocused()
})

test('digit powers stay aligned with their boxes while the table scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 })
  const scrollRegion = page.getByRole('region', { name: 'Scrollable base conversion table' })
  const binaryRow = page.getByRole('row', { name: /^Binary/ })
  const digitBox = binaryRow.getByRole('textbox', { name: 'Binary (base 2) digit at position 3' })
  const power = binaryRow.locator('.place-value-label').nth(12)

  await scrollRegion.evaluate((element) => { element.scrollLeft = 200 })
  await expect.poll(() => scrollRegion.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)

  const boxBounds = await digitBox.boundingBox()
  const powerBounds = await power.boundingBox()
  expect(boxBounds).not.toBeNull()
  expect(powerBounds).not.toBeNull()
  expect(Math.abs((boxBounds!.x + boxBounds!.width / 2) - (powerBounds!.x + powerBounds!.width / 2))).toBeLessThan(1)
})

test('typing in a row converts the value and leaves focus on the clicked breakdown toggle', async ({ page }) => {
  const decimalUnits = digit(page, 'Decimal', 10, 0)

  await decimalUnits.focus()
  await page.keyboard.press('1')
  await page.keyboard.press('0')

  await expect(decimalUnits).toHaveValue('0')
  await expect(digit(page, 'Decimal', 10, 1)).toHaveValue('1')
  await expect(digit(page, 'Hexadecimal', 16, 0)).toHaveValue('A')
  await page.getByRole('button', { name: 'Toggle Hexadecimal place-value breakdown' }).click()
  const hexadecimalBreakdown = page.getByRole('region', { name: 'Hexadecimal place-value breakdown', exact: true })
  await expect(hexadecimalBreakdown.getByRole('math').first()).toHaveAttribute('aria-label', '16 to the power of 0 times 10 (A) equals 10')
  await expect(hexadecimalBreakdown.locator('[data-breakdown-term]').first()).toHaveText('160 × 10 (A) = 10')
  await expect(hexadecimalBreakdown.getByRole('math').last()).toHaveText('10 → 10')
  await expect(page.getByRole('button', { name: 'Toggle Hexadecimal place-value breakdown' })).toBeFocused()
})

test('hexadecimal letter digits show their decimal value and symbol in each term', async ({ page }) => {
  const decimalUnits = digit(page, 'Decimal', 10, 0)
  await decimalUnits.focus()
  await page.keyboard.press('1')
  await page.keyboard.press('6')
  await page.keyboard.press('0')

  await page.getByRole('button', { name: 'Toggle Hexadecimal place-value breakdown' }).click()
  const breakdown = page.getByRole('region', { name: 'Hexadecimal place-value breakdown', exact: true })
  const term = breakdown.locator('[data-breakdown-term]')
  await expect(term).toHaveCount(1)
  await expect(term.first()).toHaveAttribute('aria-label', '16 to the power of 1 times 10 (A) equals 160')
  await expect(term.first()).toHaveText('161 × 10 (A) = 160')
  await expect(breakdown.getByRole('math').last()).toHaveText('160 → 160')
})

test('slider marks widths unavailable when the current value cannot fit', async ({ page }) => {
  const slider = page.getByRole('slider', { name: 'Bit width' })
  const decimalUnits = digit(page, 'Decimal', 10, 0)
  await decimalUnits.focus()
  for (const character of '256') await page.keyboard.press(character)

  await expect(slider).toHaveAttribute('aria-valuetext', '16 bits; unavailable widths: 8')
  const unavailableWidth = slider.getByText('8', { exact: true })
  await expect(unavailableWidth).toHaveCSS('color', 'rgb(77, 91, 113)')
  await expect(slider.getByText('unavailable', { exact: true })).toHaveCount(0)
  await expect(slider.getByText('!', { exact: true })).toHaveCount(0)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(unavailableWidth).toHaveCSS('color', 'rgb(77, 91, 113)')
  await expect(slider.getByText('!', { exact: true })).toHaveCount(0)
  await page.setViewportSize({ width: 1280, height: 720 })
  await expect(unavailableWidth).toHaveCSS('color', 'rgb(77, 91, 113)')

  await slider.focus()
  await page.keyboard.press('ArrowLeft')
  await expect(slider).toHaveAttribute('aria-valuenow', '16')
  await page.keyboard.press('ArrowRight')
  await expect(slider).toHaveAttribute('aria-valuenow', '32')
  await expect(slider).toHaveAttribute('aria-valuetext', '32 bits; unavailable widths: 8')
  await expect(decimalUnits).toHaveValue('6')
  await expect(digit(page, 'Decimal', 10, 2)).toHaveValue('2')
})

test('bit-width slider expands the cap and keeps the value intact', async ({ page }) => {
  const slider = page.getByRole('slider', { name: 'Bit width' })
  const readout = page.locator('#selected-bit-width')
  await expect(slider).toHaveAttribute('aria-valuenow', '16')
  await expect(readout).toHaveText('16')

  await slider.focus()
  await page.keyboard.press('Home')
  await expect(slider).toHaveAttribute('aria-valuenow', '8')
  await expect(readout).toHaveText('8')
  const binary8 = page.getByRole('row', { name: /^Binary/ })
  await expect(binary8.locator('[data-digit="true"]')).toHaveCount(8)
  await expect(page.getByRole('textbox', { name: 'Binary (base 2) digit at position 7' })).toBeVisible()
  await expect(page.getByText(/Maximum: 255/)).toBeVisible()

  const decimalUnits = digit(page, 'Decimal', 10, 0)
  await decimalUnits.focus()
  for (const character of '255') await page.keyboard.press(character)
  await page.keyboard.press('ArrowUp')
  await expect(page.getByText(/8 positions hold at most 255/)).toBeVisible()
  await expect(decimalUnits).toHaveValue('5')
  await expect(digit(page, 'Decimal', 10, 2)).toHaveValue('2')

  await slider.focus()
  await page.keyboard.press('ArrowRight')
  await expect(slider).toHaveAttribute('aria-valuenow', '16')
  await expect(readout).toHaveText('16')
  await expect(page.getByRole('row', { name: /^Binary/ }).locator('[data-digit="true"]')).toHaveCount(16)
  await expect(decimalUnits).toHaveValue('5')
  await page.keyboard.press('ArrowRight')
  await expect(slider).toHaveAttribute('aria-valuenow', '32')
  await expect(readout).toHaveText('32')
  const binary32 = page.getByRole('row', { name: /^Binary/ })
  await expect(binary32.locator('[data-digit="true"]')).toHaveCount(32)
  await expect(page.getByRole('textbox', { name: 'Binary (base 2) digit at position 31' })).toBeVisible()

  await decimalUnits.focus()
  for (let index = 0; index < 3; index += 1) await page.keyboard.press('Backspace')
  for (const character of '4294967295') await page.keyboard.press(character)
  await page.keyboard.press('ArrowUp')
  await expect(page.getByText(/32 positions hold at most 4294967295/)).toBeVisible()
  await expect(slider).toHaveAttribute('aria-valuetext', '32 bits; unavailable widths: 8, 16')
  await expect(page.getByText('unavailable', { exact: true })).toHaveCount(0)
  await expect(slider.getByText('8', { exact: true })).toHaveCSS('color', 'rgb(77, 91, 113)')
  await expect(slider.getByText('16', { exact: true })).toHaveCSS('color', 'rgb(77, 91, 113)')
  await expect(digit(page, 'Hexadecimal', 16, 7)).toHaveValue('F')
  await expect(digit(page, 'Binary', 2, 31)).toHaveValue('1')
  await expect(page.getByRole('textbox', { name: 'Hexadecimal (base 16) digit at position 7, bits 31–28' })).toBeVisible()
  const octalTop = digit(page, 'Octal', 8, 10)
  await expect(octalTop).toHaveAttribute('aria-label', 'Octal (base 8) digit at position 10, bits 31–30')
  const octalTopLabel = page.getByRole('row', { name: /^Octal/ }).locator('.place-value-label[data-position="10"]')
  await expect(octalTopLabel.locator(':scope > span').nth(1)).toHaveText('31–30')
})

test('typing in another base makes that row the source', async ({ page }) => {
  const hexUnits = digit(page, 'Hexadecimal', 16, 0)

  await hexUnits.focus()
  await page.keyboard.press('F')

  await expect(hexUnits).toHaveValue('F')
  await expect(digit(page, 'Decimal', 10, 0)).toHaveValue('5')
  await expect(digit(page, 'Decimal', 10, 1)).toHaveValue('1')
  await expect(hexUnits).toBeFocused()
})
