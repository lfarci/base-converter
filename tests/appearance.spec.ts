import { expect, test } from '@playwright/test'
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
