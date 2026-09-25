---
name: designer-developer-handoff
description: Use when a design or UX plan must become an actionable implementation brief for a developer or coding agent; especially use for Basewise visual and interaction changes that must preserve accessibility and existing architecture.
---

# Designer-to-Developer Handoff

Turn design intent into an implementation-ready brief without silently taking over
implementation. A developer needs enough context to make scoped changes, preserve
existing behaviour, and verify the result, not merely an aesthetic mood board.

## Ground the handoff

Read `.github/copilot-instructions.md`, the relevant source files, and applicable
`.github/instructions/` before assigning file-level work. Use
`.github/agents/developer.agent.md` as the owner of implementation, validation,
independent review, commit, and pull-request work. If the design conflicts with existing
instructions, state the conflict and the intended resolution explicitly.

## Handoff brief format

Provide these sections:

1. **Outcome:** the user-facing goal and the learner task the design should support.
2. **Design rationale:** instructional clarity, retro educational character, technical
   credibility, and visual warmth.
3. **Scope:** in-scope behaviour and appearance, explicit non-goals, and assumptions.
4. **Design specification:** hierarchy, layout, token roles, typography, states,
   responsive/overflow rules, and accessibility criteria.
5. **Ordered implementation actions:** bounded, file-by-file steps, with dependencies
   clear. Distinguish required outcomes from optional ideas.
6. **Preserve:** existing interaction behaviour, domain invariants, architecture, and
   repository conventions.
7. **Acceptance and verification:** measurable expected behaviour, relevant tests, and
   commands.
8. **Open decisions:** unresolved product choices or risks that Developer must clarify
   rather than guess.

Avoid vague tasks such as "make it retro" or "polish accessibility." Describe the visible
result, required states, relevant constraints, and evidence that will demonstrate
completion. Do not invent component paths before checking the repository.

## Basewise implementation constraints

Use the existing architecture table:

| Area | Required owner |
| --- | --- |
| Value math, parsing, formatting, digit/base definitions | `src/conversion.ts` |
| Digit row presentation and event callback wiring | `src/DigitRow.tsx` |
| Application state, focus/caret policy, keyboard stepping, table layout | `src/App.tsx` |
| Shared CSS design tokens | `src/index.css` |
| Browser interaction specifications | `tests/` |

Keep all value math, parsing, and formatting out of React/JSX. Keep `DigitRow` presentational,
centralize shared tokens instead of hard-coding them per component, and leave per-base
accents in the existing `rows` definitions.

Unless the user's scope explicitly changes them, require preservation of:

- sixteen positions and the `65535` maximum value,
- an intact grid and clear "too large" notice when input exceeds the cap,
- rejection of invalid digits without replacing the prior valid value,
- empty input remaining distinct from zero,
- value-based arrow-key stepping and the existing Page Up/Down step sizes,
- exactly one Tab stop per digit row, on the rightmost units box,
- horizontal table scrolling at 390px instead of collapsing the grid,
- status and error meaning expressed in words, not color alone.

## Accessibility and verification

Carry forward testable accessibility acceptance criteria from
`.github/skills/accessibility-first-interface-planning/SKILL.md`. For user-visible
changes, update `README.md` when behaviour, commands, or file layout changes. Add or
update a Playwright spec and run `npm run test:e2e` whenever digit entry, keyboard
handling, or the value cap changes.

For implementation, Developer runs:

```sh
npm run typecheck
npm run lint
npm run build
```

The accessibility acceptance criteria must be checked in the rendered interface, not
inferred from a design brief. If any required criterion cannot be verified or an
accessibility finding remains unresolved, flag it as a blocker rather than treating a
retro-style exception as acceptable.

## Delegate

When the repository's `Developer` custom agent can be invoked, pass it the complete
handoff brief and ask it to follow `.github/agents/developer.agent.md`. If the runtime
cannot invoke that agent, return the same complete brief for the requester to route to
Developer. Do not edit code, claim implementation is finished, or claim that tests,
review, commits, or a pull request are complete.

## Process inspiration

The following publicly available skills informed this workflow's boundaries and checklists;
this skill is repository-specific and does not reproduce their text:

- [Microsoft Frontend Design Review](https://github.com/microsoft/skills/blob/main/.github/skills/frontend-design-review/SKILL.md)
- [GitHub Web Design Reviewer](https://github.com/github/awesome-copilot/blob/main/skills/web-design-reviewer/SKILL.md)
- [GitHub Copilot agent skills documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills)
