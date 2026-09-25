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

test('shows only valid digit places and labels octal and hexadecimal bit groups', async ({ page }) => {
  const digitCounts = [
    { base: 'Decimal', radix: 10, count: 5 },
    { base: 'Binary', radix: 2, count: 16 },
    { base: 'Octal', radix: 8, count: 6 },
    { base: 'Hexadecimal', radix: 16, count: 4 },
  ]

  for (const { base, radix, count } of digitCounts) {
    const row = page.getByRole('row').filter({ has: digit(page, base, radix, 0) })
    await expect(row.locator('[data-digit="true"]')).toHaveCount(count)
    await expect(row.locator('[data-digit="true"]:disabled')).toHaveCount(0)
  }

  await expect(digit(page, 'Octal', 8, 0)).toHaveAttribute('aria-label', /bits 2–0/)
  await expect(digit(page, 'Octal', 8, 5)).toHaveAttribute('aria-label', /bit 15/)
  await expect(digit(page, 'Hexadecimal', 16, 0)).toHaveAttribute('aria-label', /bits 3–0/)
  await expect(digit(page, 'Hexadecimal', 16, 3)).toHaveAttribute('aria-label', /bits 15–12/)
})

test('orders rows decimal, binary, octal, hexadecimal', async ({ page }) => {
  const names = await page.locator('tbody > tr').evaluateAll((rows) =>
    rows.map((row) => row.querySelector('th[scope="row"] button')?.textContent?.trim() ?? ''),
  )

  expect(names).toEqual(['Decimal', 'Binary', 'Octal', 'Hexadecimal'])
})
