import { expect, test } from '@playwright/test'
import { digit } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('arrow and page keys step the value in the active base', async ({ page }) => {
  const decimalUnits = digit(page, 'Decimal', 10, 0)

  await decimalUnits.focus()
  await page.keyboard.press('ArrowUp')
  await expect(decimalUnits).toHaveValue('1')
  await page.keyboard.press('PageUp')
  await expect(decimalUnits).toHaveValue('1')
  await expect(digit(page, 'Decimal', 10, 1)).toHaveValue('1')
  await expect(digit(page, 'Hexadecimal', 16, 0)).toHaveValue('B')
  await expect(decimalUnits).toBeFocused()
})

test('Tab moves through the units digits in the documented row order', async ({ page }) => {
  const rowOrder = [
    digit(page, 'Hexadecimal', 16, 0),
    digit(page, 'Decimal', 10, 0),
    digit(page, 'Octal', 8, 0),
    digit(page, 'Binary', 2, 0),
  ]

  await rowOrder[0].focus()
  for (const nextRow of rowOrder.slice(1)) {
    await page.keyboard.press('Tab')
    await expect(nextRow).toBeFocused()
  }
})

test('backspace removes the newest typed digit', async ({ page }) => {
  const decimalUnits = digit(page, 'Decimal', 10, 0)

  await decimalUnits.focus()
  await page.keyboard.press('2')
  await page.keyboard.press('1')
  await page.keyboard.press('Backspace')

  await expect(decimalUnits).toHaveValue('2')
  await expect(digit(page, 'Hexadecimal', 16, 0)).toHaveValue('2')
})
