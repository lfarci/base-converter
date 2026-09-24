import type { Page } from '@playwright/test'

export function digit(page: Page, base: string, radix: number, position: number) {
  return page.getByRole('textbox', {
    name: `${base} (base ${radix}) digit at position ${position}`,
    exact: true,
  })
}
