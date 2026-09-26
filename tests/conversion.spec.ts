import { expect, test } from '@playwright/test'
import { digit } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('place-value help stays concise and each row breakdown is collapsed by default', async ({ page }) => {
  await expect(page.getByRole('columnheader', { name: 'Digits and place values', exact: true })).toBeVisible()
  await expect(page.getByText('Each position is numbered from zero on the right and labeled under its box.', { exact: false })).toBeVisible()

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

test('typing in another base makes that row the source', async ({ page }) => {
  const hexUnits = digit(page, 'Hexadecimal', 16, 0)

  await hexUnits.focus()
  await page.keyboard.press('F')

  await expect(hexUnits).toHaveValue('F')
  await expect(digit(page, 'Decimal', 10, 0)).toHaveValue('5')
  await expect(digit(page, 'Decimal', 10, 1)).toHaveValue('1')
  await expect(hexUnits).toBeFocused()
})
