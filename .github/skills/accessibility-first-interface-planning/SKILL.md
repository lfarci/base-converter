---
name: accessibility-first-interface-planning
description: Use when planning or reviewing the accessibility of a web interface, especially design concepts, visual states, keyboard interactions, responsive layouts, or Developer handoffs; accessibility requirements override aesthetic preferences.
---

# Accessibility-First Interface Planning

Treat accessibility as a design input and a release gate, not a finishing pass. A
beautiful concept is not acceptable if its colors, structure, interaction model, or
responsive behaviour exclude users. A visual plan can define acceptance criteria, but
cannot prove implementation conformance; identify what must be measured or tested in
the rendered interface.

## Plan for WCAG 2.2 AA

- Text contrast: at least **4.5:1** for normal text and **3:1** for large text.
- Meaningful non-text UI boundaries, icons, and state indicators: at least **3:1**
  against adjacent colors. Decorative borders and bevels cannot be the only cue for a
  control boundary or state.
- Focus: show a clear, high-contrast visible keyboard focus indicator on every
  interactive control. Never propose removing focus outlines without an equally visible
  replacement. Ensure sticky regions do not cover focus.
- Input and state: identify semantic controls, roles, accessible names, instructions,
  validation messages, and live announcements. Never use color, texture, or bevel alone
  to convey meaning.
- Keyboard: define complete keyboard operation and a logical focus order. Use native
  semantics first and ARIA only when native HTML cannot express the interaction.
- Pointer targets: check WCAG 2.2 target-size minimums and spacing or an applicable
  exception; do not let small retro controls become difficult to activate.
- Text and reflow: keep type legible and avoid restrictive fixed heights. Check 200%
  text resizing, 400% zoom/reflow, and user text-spacing overrides without clipped
  text or controls. Preserve two-dimensional scrolling only for content such as a
  dense reference table that genuinely needs it; keep the surrounding page usable.
- Preferences: respect `prefers-reduced-motion`, `prefers-contrast`, and forced-colors
  mode where relevant. Do not introduce decorative motion that adds no instructional
  value.

## Treat retro detail as decoration

Bevels, paper grain, CRT accents, and muted palettes are subordinate to content and
accessibility. Verify real color pairs rather than assuming a color name or visual
impression meets contrast. Pair state styling with clear words and, where helpful,
icons or patterns. Texture must remain subtle enough not to obscure glyph edges,
boundaries, or focus.

## Basewise handoff checks

For this repository, explicitly preserve:

- one digit-entry Tab stop per row: only the rightmost units box is tabbable,
- labels that expose base, radix, and position, and explanations for disabled positions,
- an error/status message in words and the existing single live-region convention,
- the fixed sixteen-position value cap and intact grid when a value is too large,
- horizontal table scrolling at 390px rather than collapsing the grid.

See `.github/copilot-instructions.md` and the applicable files under
`.github/instructions/` for the complete component and interaction conventions.

## Handoff evidence

Write testable acceptance criteria that name the affected states and how Developer
should verify them: measured contrast pairs; keyboard traversal and visible focus;
accessible names and announced validation; responsive layout; zoom and text spacing;
reduced motion, increased contrast, and forced-colors behaviour. Separate requirements
from unverified assumptions. Never claim an unrendered design concept passed an
accessibility audit.

## References

- [GitHub's instructions for adding Copilot agent skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills)
  documents project-level `.github/skills/<skill-name>/SKILL.md` structure.
- [Shopify Liquid Theme A11Y skill](https://github.com/Shopify/liquid-skills/blob/main/plugins/liquid-skills/skills/liquid-theme-a11y/SKILL.md)
  is a reference for semantic patterns, visible focus, keyboard operation, and
  reduced-motion guidance. Adapt principles to this React project; do not copy its
  Liquid-specific component examples.
