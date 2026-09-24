import { expect, test } from '@playwright/test'
import { digit } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('rejects digits outside the active base', async ({ page }) => {
  const octalUnits = digit(page, 'Octal', 8, 0)

  await octalUnits.focus()
  await page.keyboard.press('8')

  await expect(page.getByRole('alert')).toContainText('Enter digits 0–7 for base 8.')
  await expect(octalUnits).toHaveValue('0')
})

test('does not step beyond the 16-bit limit', async ({ page }) => {
  const decimalUnits = digit(page, 'Decimal', 10, 0)

  await decimalUnits.focus()
  for (const key of '65535') await page.keyboard.press(key)
  await page.keyboard.press('ArrowUp')

  await expect(page.getByRole('alert')).toContainText('That number is too large.')
  await expect(decimalUnits).toHaveValue('5')
  await expect(digit(page, 'Decimal', 10, 4)).toHaveValue('6')
})

test('shows one shared position header for all rows', async ({ page }) => {
  await expect(page.getByRole('list', { name: 'Digit positions, most significant first' })).toHaveCount(1)
})
