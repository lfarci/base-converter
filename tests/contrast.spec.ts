import { expect, test, type Locator } from '@playwright/test'
import { digit } from './helpers'

// WCAG 2.2 AA, measured rather than assumed. Colours are read from the computed styles in
// the page; each element's effective background is resolved by walking up until a
// non-transparent background is found; the ratios are computed here in Node.

// Chromium and Firefox report plain colours as `rgb()` and `color-mix()` results as
// `color(srgb …)`, whose components are already 0–1 rather than 0–255.
const luminance = (colour: string) => {
  const channels = colour.match(/[\d.]+/g)!.slice(0, 3).map(Number)
  const [r, g, b] = channels.map((channel) => {
    const value = colour.startsWith('color(') ? channel : channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrast = (a: string, b: string) => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (high + 0.05) / (low + 0.05)
}

// Under `forced-colors: active` the engine overrides backgrounds, so the source row's
// margin bar has to be marked with a system colour or it disappears into the cell.
test('forced colors keeps the source bar and the highlight cues visible', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' })
  await page.goto('./')

  const bar = page.locator('th[scope="row"][data-source] > div')
  const barFill = await bar.evaluate((element) => getComputedStyle(element).backgroundColor)
  const cellFill = await bar.evaluate((element) => getComputedStyle(element.parentElement!).backgroundColor)
  expect(contrast(barFill, cellFill), `source bar in forced colors: ${barFill} on ${cellFill}`).toBeGreaterThanOrEqual(3)

  const units = digit(page, 'Decimal', 10, 0)
  await expect(units).toHaveCSS('border-top-color', barFill)

  const tensDigit = digit(page, 'Decimal', 10, 1)
  await tensDigit.hover()
  await expect(tensDigit.locator('xpath=..').locator('.place-value-label')).toHaveCSS('text-decoration-line', 'underline')
  await expect(tensDigit).toHaveCSS('outline-style', 'solid')
})

const sample = (locator: Locator) => locator.evaluate((element) => {
  const rising = (from: Element | null) => {
    let node = from
    let colour = 'rgba(0, 0, 0, 0)'
    while (node && colour === 'rgba(0, 0, 0, 0)') {
      colour = getComputedStyle(node).backgroundColor
      node = node.parentElement
    }
    return colour
  }
  const style = getComputedStyle(element)
  return {
    text: style.color,
    border: style.borderTopColor,
    outline: style.outlineColor,
    fill: rising(element),
    around: rising(element.parentElement),
  }
})

test('every documented text pair clears 4.5:1 and every boundary clears 3:1', async ({ page }) => {
  await page.goto('./')

  const text: Array<[string, Locator]> = [
    ['ink on paper (title)', page.locator('h1#page-title')],
    ['ink-soft on paper (intro)', page.locator('section[aria-labelledby="page-title"] > p').first()],
    ['ink-soft on paper (footer note)', page.locator('section > p').last()],
    ['ink on paper-3 (section header)', page.locator('#result-title')],
        ['ink-soft on well (panel guidance)', page.locator('#result-title + p')],
    ['ink on paper-3 (status strip)', page.locator('#edit-status')],
    ['ink on paper-3 (help label)', page.locator('details summary span').last()],
    ['ink-soft on paper-3 (help copy)', page.locator('details p')],
    ['ink-soft on paper-3 (column headers)', page.locator('th[scope="col"]').first()],
    ['ink on paper-2 (base name)', page.locator('th[scope="row"] button span').first()],
    ['ink-soft on paper-2 (radix)', page.locator('th[scope="row"] span > span').last()],
    ['ink-soft on paper-2 (place-value label)', page.locator('.place-value-label').first()],
  ]

  for (const [name, locator] of text) {
    const { text: colour, fill } = await sample(locator)
    expect(contrast(colour, fill), `${name}: ${colour} on ${fill}`).toBeGreaterThanOrEqual(4.5)
  }

    // The digits sit on the inset field surface, which is the darkest tone any digit glyph
      // lands on, so it is measured directly rather than inferred from the label above it.
      const readout = digit(page, 'Decimal', 10, 4)
      const readoutInk = await readout.evaluate((element) => ({
        text: getComputedStyle(element).color,
        fill: getComputedStyle(element).backgroundColor,
      }))
      expect(
        contrast(readoutInk.text, readoutInk.fill),
        `ink on the field surface: ${readoutInk.text} on ${readoutInk.fill}`,
      ).toBeGreaterThanOrEqual(4.5)

  // The writable box's frame has to separate the cell from the row surface and from its own
    // tint. All four bases are measured, not just decimal: each frame is a different accent-ink
    // mix, and decimal is the lightest accent, so it is the worst case for the tint pair and
    // the suite would go blind to the others if it only ever sampled one.
    //
    // All three skins are covered because each is a different border colour. The default and
    // highlighted states both paint `--digit-frame` over an 8% / 12% accent tint, so those two
    // are what actually pin the 55/45 mix. Focus keeps that frame against a 14% tint, so it
    // remains part of the boundary check along with the accessible outline contrast measured
    // below.
    const bases: Array<[string, number]> = [['Decimal', 10], ['Binary', 2], ['Octal', 8], ['Hexadecimal', 16]]
    for (const [base, radix] of bases) {
      for (const state of ['default', 'highlighted', 'focused'] as const) {
        const box = digit(page, base, radix, 0)
        // Moving the pointer off the row first keeps the hover highlight from leaking in.
        await page.mouse.move(0, 0)
        if (state === 'highlighted') await box.hover()
        else if (state === 'focused') await box.focus()
        // The default state cannot be reached by clicking the body: the app deliberately
        // returns the caret to the editable surface on pointerup, so the box stays focused and
        // would keep painting `--color-focus` in all three iterations — which is precisely how
        // an earlier version of this loop silently never measured decimal's frame. Focusing a
        // real control (the row's breakdown toggle) is what actually blurs it.
        else await page.getByRole('button', { name: `Toggle ${base} place-value breakdown` }).focus()
        await page.waitForTimeout(400)

        const writable = await sample(box)
        expect(
          writable.border,
          `writable frame should be painted, not transparent (${base}, ${state})`,
        ).not.toBe('rgba(0, 0, 0, 0)')
        expect(
          contrast(writable.border, writable.around),
          `writable frame outside (${base}, ${state}): ${writable.border} on ${writable.around}`,
        ).toBeGreaterThanOrEqual(3)
        expect(
          contrast(writable.border, writable.fill),
          `writable frame inside (${base}, ${state}): ${writable.border} on ${writable.fill}`,
        ).toBeGreaterThanOrEqual(3)
      }
    }

  // The cooler converter surround is a separate framed surface against the paper desk.
  const panel = await page.locator('#result-title').locator('xpath=..').evaluate((element) => ({
    frame: getComputedStyle(element).borderLeftColor,
    fill: getComputedStyle(element).backgroundColor,
    desk: getComputedStyle(document.documentElement).backgroundColor,
  }))
  expect(contrast(panel.frame, panel.fill), `panel frame: ${panel.frame} on ${panel.fill}`).toBeGreaterThanOrEqual(3)
  expect(contrast(panel.frame, panel.desk), `panel frame outside: ${panel.frame} on ${panel.desk}`).toBeGreaterThanOrEqual(3)

  // The source row's margin bar is a boundary, so it clears 3:1 against the row surface.
  const bar = await sample(page.locator('th[scope="row"][data-source] > div'))
  expect(contrast(bar.fill, bar.around), `source margin bar: ${bar.fill} on ${bar.around}`).toBeGreaterThanOrEqual(3)

    // A highlighted place-value label's border is a boundary too, and it is the *other* site
    // that mixes the accent with ink. It had no coverage at all, which is how a mix that
    // measured only 3.06:1 — passing by 0.06 — sat unnoticed. The decimal row is measured
    // because decimal is the lightest accent and therefore the worst case for every
    // accent-vs-tint pair; sampling `[data-highlighted]` first would silently pick up a
    // binary label and pass even with no mix at all.
    const decimalUnitsForLabel = digit(page, 'Decimal', 10, 0)
    await decimalUnitsForLabel.focus()
    for (const key of '123') await page.keyboard.press(key)
    const decimalLabel = digit(page, 'Decimal', 10, 1).locator('xpath=..').locator('.place-value-label')
    // Hovering the digit is what marks the place as highlighted in both directions.
    await digit(page, 'Decimal', 10, 1).hover()
    await expect(decimalLabel).toHaveAttribute('data-highlighted', 'true')
    const labelBox = await sample(decimalLabel)
    // A transparent border would sail through the contrast maths below: `rgba(0, 0, 0, 0)` is
    // read as near-black by the luminance helper and scores ~18.6:1, so a label with no border
    // at all would look like the strongest boundary on the page. Require it to be painted.
    expect(
      labelBox.border,
      'highlighted label border should be painted, not transparent',
    ).not.toBe('rgba(0, 0, 0, 0)')
    expect(
      contrast(labelBox.border, labelBox.fill),
      `highlighted label border: ${labelBox.border} on ${labelBox.fill}`,
    ).toBeGreaterThanOrEqual(3)
    expect(
      contrast(labelBox.border, labelBox.around),
      `highlighted label border outside: ${labelBox.border} on ${labelBox.around}`,
    ).toBeGreaterThanOrEqual(3)

  const units = digit(page, 'Decimal', 10, 0)
  await units.focus()
  // Let the focus transition settle so the sampled outline colour is the end state.
  await page.waitForTimeout(400)
  const ring = await sample(units)
  expect(contrast(ring.outline, ring.around), `focus ring: ${ring.outline} on ${ring.around}`).toBeGreaterThanOrEqual(3)
})

  // The worked calculation is a second inset field surface with its own two text roles, so it
  // is measured with the breakdown actually open rather than assumed from the readouts.
  test('the breakdown inset keeps its text and rules legible on the field surface', async ({ page }) => {
    await page.goto('./')
    await digit(page, 'Decimal', 10, 0).focus()
    for (const key of '123') await page.keyboard.press(key)
    await page.getByRole('button', { name: 'Toggle Decimal place-value breakdown' }).click()

    const breakdown = page.locator('#decimal-place-value-breakdown section')
    const heading = await sample(breakdown.locator('h3'))
    expect(
      contrast(heading.text, heading.fill),
      `breakdown heading: ${heading.text} on ${heading.fill}`,
    ).toBeGreaterThanOrEqual(4.5)

    const equation = await sample(breakdown.locator('[data-breakdown-term]').first())
    expect(
      contrast(equation.text, equation.fill),
      `breakdown equation: ${equation.text} on ${equation.fill}`,
    ).toBeGreaterThanOrEqual(4.5)

    const total = await sample(breakdown.locator('[role="math"]').last())
    expect(
      contrast(total.text, total.fill),
      `breakdown total: ${total.text} on ${total.fill}`,
    ).toBeGreaterThanOrEqual(4.5)

    // The worked-calculation inset's left rule is a real boundary marking the block off from
    // the panel, so it is held to 3:1 like the other frames rather than treated as a
    // decorative hairline.
    const rule = await breakdown.evaluate((element) => {
      const style = getComputedStyle(element)
      return { colour: style.borderLeftColor, fill: style.backgroundColor }
    })
    expect(
      contrast(rule.colour, rule.fill),
      `breakdown inset rule: ${rule.colour} on ${rule.fill}`,
    ).toBeGreaterThanOrEqual(3)

        // Each equation carries its own accent bar, painted as an inset `box-shadow` rather than
            // a border. That is invisible to `borderLeftColor`, so the block above would not have
            // caught a failing accent mix on it — which is exactly the gap that hid a 2.46:1 decimal
            // bar. The bar only exists while the term is highlighted (focusing it sets the state, as
            // hovering the matching digit would), so the term is focused first and the assertion
            // demands the shadow colour actually be there rather than silently skipping.
            const term = breakdown.locator('[data-breakdown-term]').first()
            await term.focus()
            await page.waitForTimeout(400)
            const termBar = await term.evaluate((element) => {
              const style = getComputedStyle(element)
              // `inset 3px 0 0 0 <colour>`; match `color(srgb …)` first so the leading `rgb(` inside
              // it is not mistaken for plain `rgb()` and divided by 255 by the luminance helper.
              return {
                colour: style.boxShadow.match(/color\([^)]+\)|rgba?\([^)]+\)/)?.[0] ?? null,
                fill: style.backgroundColor,
                shadow: style.boxShadow,
              }
            })
            expect(
              termBar.colour,
              `highlighted term should paint an accent bar, but box-shadow was: ${termBar.shadow}`,
            ).not.toBeNull()
            expect(
              contrast(termBar.colour!, termBar.fill),
              `breakdown term accent bar: ${termBar.colour} on ${termBar.fill}`,
            ).toBeGreaterThanOrEqual(3)
          })
