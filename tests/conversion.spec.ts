import { expect, test } from '@playwright/test'
import { digit } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('place-value help stays concise and each row breakdown is collapsed by default', async ({ page }) => {
  await expect(page.getByRole('columnheader', { name: 'Position', exact: true })).toBeVisible()
  await expect(page.getByText('Each position has a value: baseposition.', { exact: false })).toBeVisible()

  const instructions = page.locator('details').filter({ has: page.getByText('How to use', { exact: true }) })
  await expect(instructions).not.toHaveAttribute('open', '')
  await instructions.locator('summary').click()
  await expect(instructions).toContainText('Tab moves from each row\'s units digit to its breakdown toggle')
  await expect(instructions).toContainText('Backspace and Delete remove the newest digit')
  await expect(instructions).toContainText('16-bit limit')

  for (const base of ['Hexadecimal', 'Decimal', 'Octal', 'Binary']) {
    const toggle = page.getByRole('button', { name: `Show ${base} place-value breakdown` })
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByRole('region', { name: `${base} place-value breakdown`, exact: true })).toHaveCount(0)
  }
  await expect(page.getByText('Show place-value breakdown', { exact: true })).toHaveCount(0)
})

test('the converter stays uncluttered with only powers beneath the digit boxes', async ({ page }) => {
  const rows = [
    { name: 'Hexadecimal', radix: 16 },
    { name: 'Decimal', radix: 10 },
    { name: 'Octal', radix: 8 },
    { name: 'Binary', radix: 2 },
  ]

  for (const { name, radix } of rows) {
    const digitRow = page.getByRole('row', { name: new RegExp(`^${name}`) })
    const powers = digitRow.locator('.place-value-label')
    await expect(powers).toHaveCount(16)

    for (let index = 0; index < 16; index += 1) {
      const position = 15 - index
      const digit = digitRow.getByRole('textbox', { name: `${name} (base ${radix}) digit at position ${position}`, exact: true })
      const label = powers.nth(index)
      await expect(label.locator(':scope > span')).toHaveCount(1)
      await expect(label.locator(':scope > span')).toHaveText(`${radix}${position}`)
      await expect(label.locator('sup')).toHaveText(String(position))
      await expect(digit).toHaveValue('0')
    }
  }

  const hexadecimalRow = page.getByRole('row', { name: /^Hexadecimal/ })
  await expect(hexadecimalRow.getByRole('textbox', { name: 'Hexadecimal (base 16) digit at position 15' })).toBeDisabled()
  await page.getByRole('button', { name: 'Show Hexadecimal place-value breakdown' }).click()
  const hexadecimalBreakdown = page.getByRole('region', { name: 'Hexadecimal place-value breakdown', exact: true })
  await expect(hexadecimalBreakdown).toContainText('0 = 0')
  await expect(page.getByRole('region', { name: 'Decimal place-value breakdown', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Hide Hexadecimal place-value breakdown' })).toHaveAttribute('aria-expanded', 'true')
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
    await page.getByRole('button', { name: `Show ${name} place-value breakdown` }).click()
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
  await page.getByRole('button', { name: 'Show Hexadecimal place-value breakdown' }).click()
  const hexadecimalBreakdown = page.getByRole('region', { name: 'Hexadecimal place-value breakdown', exact: true })
  await expect(hexadecimalBreakdown.getByRole('math').first()).toHaveAttribute('aria-label', '16 to the power of 0 times 10 (A) equals 10')
  await expect(hexadecimalBreakdown.locator('[data-breakdown-term]').first()).toHaveText('160 × 10 (A) = 10')
  await expect(hexadecimalBreakdown.getByRole('math').last()).toHaveText('10 → 10')
  await expect(page.getByRole('button', { name: 'Hide Hexadecimal place-value breakdown' })).toBeFocused()
})

test('hexadecimal letter digits show their decimal value and symbol in each term', async ({ page }) => {
  const decimalUnits = digit(page, 'Decimal', 10, 0)
  await decimalUnits.focus()
  await page.keyboard.press('1')
  await page.keyboard.press('6')
  await page.keyboard.press('0')

  await page.getByRole('button', { name: 'Show Hexadecimal place-value breakdown' }).click()
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
