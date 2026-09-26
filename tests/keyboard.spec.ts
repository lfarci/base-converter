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

test('Tab reaches each base title between the units digits in row order', async ({ page }) => {
  const rows = [
    { name: 'Decimal', radix: 10 },
    { name: 'Binary', radix: 2 },
    { name: 'Octal', radix: 8 },
    { name: 'Hexadecimal', radix: 16 },
  ]

  await digit(page, rows[0].name, rows[0].radix, 0).focus()
  for (let index = 0; index < rows.length; index += 1) {
    const { name } = rows[index]
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: `Toggle ${name} place-value breakdown` })).toBeFocused()

    const nextRow = rows[index + 1]
    if (nextRow) {
      await page.keyboard.press('Tab')
      await expect(digit(page, nextRow.name, nextRow.radix, 0)).toBeFocused()
    } else {
      await page.keyboard.press('Tab')
      await expect(digit(page, rows[0].name, rows[0].radix, 0)).toBeFocused()
    }
  }
})

test('Shift+Tab moves backward from units digits to the previous row base title', async ({ page }) => {
  await digit(page, 'Binary', 2, 0).focus()

  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: 'Toggle Decimal place-value breakdown' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(digit(page, 'Decimal', 10, 0)).toBeFocused()
})

test('an open breakdown places terms directly after the base title in the Tab order', async ({ page }) => {
  const units = digit(page, 'Decimal', 10, 0)
  await units.focus()
  await page.keyboard.press('1')

  const toggle = page.getByRole('button', { name: 'Toggle Decimal place-value breakdown' })
  await toggle.click()
  await page.keyboard.press('Tab')

  const firstTerm = page.locator('#decimal-place-value-breakdown [data-breakdown-term]').first()
  await expect(firstTerm).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: 'Toggle Decimal place-value breakdown' })).toBeFocused()
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

test('hover links a digit, its position label, and its matching breakdown term', async ({ page }) => {
  const decimalUnits = digit(page, 'Decimal', 10, 0)
  await decimalUnits.focus()
  await page.keyboard.press('1')
  await page.keyboard.press('2')
  await page.keyboard.press('3')

  await page.getByRole('button', { name: 'Toggle Decimal place-value breakdown' }).click()
  const tensDigit = digit(page, 'Decimal', 10, 1)
  const tensLabel = tensDigit.locator('xpath=..').locator('.place-value-label')
  const tensTerm = page.locator('#decimal-place-value-breakdown [data-breakdown-term][data-position="1"]')

  await tensDigit.hover()
  await expect(tensDigit).toHaveAttribute('data-highlighted', 'true')
  await expect(tensLabel).toHaveAttribute('data-highlighted', 'true')
  await expect(tensTerm).toHaveAttribute('data-highlighted', 'true')

  const onesDigit = digit(page, 'Decimal', 10, 0)
  const onesLabel = onesDigit.locator('xpath=..').locator('.place-value-label')
  const onesTerm = page.locator('#decimal-place-value-breakdown [data-breakdown-term][data-position="0"]')
  await onesTerm.hover()
  await expect(onesDigit).toHaveAttribute('data-highlighted', 'true')
  await expect(onesLabel).toHaveAttribute('data-highlighted', 'true')
  await expect(onesTerm).toHaveAttribute('data-highlighted', 'true')
  await expect(tensDigit).not.toHaveAttribute('data-highlighted', 'true')

  await page.mouse.move(0, 0)
  await onesTerm.focus()
  await expect(onesDigit).toHaveAttribute('data-highlighted', 'true')
  await expect(onesLabel).toHaveAttribute('data-highlighted', 'true')

  const binaryBit = digit(page, 'Binary', 2, 3)
  const binaryLabel = binaryBit.locator('xpath=..').locator('.place-value-label')
  await binaryBit.hover()
  await expect(binaryBit).toHaveAttribute('data-highlighted', 'true')
  await expect(binaryLabel).toHaveAttribute('data-highlighted', 'true')
})

test('octal and hexadecimal hover highlights only their corresponding binary bits', async ({ page }) => {
  for (const { name, radix, position, bits } of [
    { name: 'Octal', radix: 8, position: 0, bits: [0, 1, 2] },
    { name: 'Octal', radix: 8, position: 5, bits: [15] },
    { name: 'Hexadecimal', radix: 16, position: 2, bits: [8, 9, 10, 11] },
  ]) {
    const group = digit(page, name, radix, position)
    await group.hover()
    await expect(group).toHaveAttribute('data-highlighted', 'true')

    for (let bit = 0; bit < 16; bit += 1) {
      const binaryDigit = digit(page, 'Binary', 2, bit)
      const binaryLabel = binaryDigit.locator('xpath=..').locator('.place-value-label')
      if (bits.includes(bit)) {
        await expect(binaryDigit).toHaveAttribute('data-highlighted', 'true')
        await expect(binaryLabel).toHaveAttribute('data-highlighted', 'true')
      } else {
        await expect(binaryDigit).not.toHaveAttribute('data-highlighted', 'true')
      }
    }

    await page.mouse.move(0, 0)
    await expect(digit(page, 'Binary', 2, bits[0])).not.toHaveAttribute('data-highlighted', 'true')
  }
})

test('hovering a hexadecimal digit or focusing a breakdown term links its binary bits', async ({ page }) => {
  await digit(page, 'Hexadecimal', 16, 1).hover()
  await expect(digit(page, 'Binary', 2, 4)).toHaveAttribute('data-highlighted', 'true')
  await expect(digit(page, 'Binary', 2, 7)).toHaveAttribute('data-highlighted', 'true')
  await expect(digit(page, 'Binary', 2, 8)).not.toHaveAttribute('data-highlighted', 'true')

  await page.mouse.move(0, 0)
  await digit(page, 'Decimal', 10, 0).focus()
  await expect(digit(page, 'Binary', 2, 4)).not.toHaveAttribute('data-highlighted', 'true')

  const hexadecimalUnits = digit(page, 'Hexadecimal', 16, 0)
  await hexadecimalUnits.focus()
  await page.keyboard.press('A')
  await page.getByRole('button', { name: 'Toggle Hexadecimal place-value breakdown' }).click()
  const term = page.locator('#hexadecimal-place-value-breakdown [data-breakdown-term][data-position="0"]')
  await term.focus()
  await expect(digit(page, 'Binary', 2, 0)).toHaveAttribute('data-highlighted', 'true')
  await expect(digit(page, 'Binary', 2, 3)).toHaveAttribute('data-highlighted', 'true')
  await expect(digit(page, 'Binary', 2, 4)).not.toHaveAttribute('data-highlighted', 'true')
})

test('only the units box of each row is writable and focusable', async ({ page }) => {
  const rows = [
    { name: 'Decimal', radix: 10, positions: 5, typed: '9' },
    { name: 'Binary', radix: 2, positions: 16, typed: '1' },
    { name: 'Octal', radix: 8, positions: 6, typed: '7' },
    { name: 'Hexadecimal', radix: 16, positions: 4, typed: 'F' },
  ]

  for (const { name, radix, positions, typed } of rows) {
    const units = digit(page, name, radix, 0)
    await expect(units).not.toHaveAttribute('readonly', '')
    await expect(units).toHaveAttribute('tabindex', '0')
    await expect(units).toHaveCSS('border-width', '2px')
    await expect(units).not.toHaveCSS('background-color', 'rgb(255, 255, 255)')

    await units.click()
    await page.keyboard.press(typed)
    await expect(units).toHaveValue(typed)

    for (let position = 1; position < positions; position += 1) {
      const readout = digit(page, name, radix, position)
      await expect(readout).toHaveAttribute('readonly', '')
      await expect(readout).toHaveAttribute('tabindex', '-1')
      await expect(readout).not.toBeDisabled()
      await expect(readout).toHaveCSS('cursor', 'default')
      await expect(readout).not.toHaveCSS('border-width', '2px')

      await readout.hover()
      await expect(readout).not.toBeFocused()
      await readout.click()
      await expect(readout).not.toBeFocused()
      await expect(units).toBeFocused()
    }
  }
})

test('collapsed rows highlight position labels without opening, and digit typing still works', async ({ page }) => {
  const decimalUnits = digit(page, 'Decimal', 10, 0)
  const unitsLabel = decimalUnits.locator('xpath=..').locator('.place-value-label')
  const toggle = page.getByRole('button', { name: 'Toggle Decimal place-value breakdown' })

  await decimalUnits.hover()
  await expect(decimalUnits).toHaveAttribute('data-highlighted', 'true')
  await expect(unitsLabel).toHaveAttribute('data-highlighted', 'true')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('#decimal-place-value-breakdown')).toHaveCount(0)

  await page.mouse.move(0, 0)
  await decimalUnits.focus()
  await expect(unitsLabel).toHaveAttribute('data-highlighted', 'true')
  await page.keyboard.press('7')
  await expect(digit(page, 'Decimal', 10, 0)).toHaveValue('7')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
})
