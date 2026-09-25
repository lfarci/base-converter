---
name: retro-educational-ui-design
description: Use when planning, proposing, or refining a retro educational-computing interface, especially a worksheet-like learning tool; create warm, structured, technically credible UI concepts without compromising accessibility.
---

# Retro Educational UI Design

Design the interface as a teaching aid and technical reference, not a generic product
dashboard. Combine the clarity of a computer science textbook or printed worksheet with
the tactile character of 1990s classroom software and early educational desktop apps.
Historical references are inspiration, not a reason to reproduce dated usability limits
or copy a specific product.

## Establish the direction

Before detailing components, identify the learner's task, what they need to understand,
and the hierarchy that makes that learning path obvious. Use structure to teach: clear
section headings, short labels, visible relationships between values, and orderly
tables or framed panels. Add progressive disclosure only when it reduces clutter without
hiding information the learner needs to complete the task.

Use the requested visual character as a restrained system:

- **Surfaces:** warm cream or paper-like backgrounds; a faint grain is optional only when
  it remains unobtrusive at zoom and never lowers text or boundary contrast.
- **Typography:** bold serif or slab-serif display headings; uppercase labels for
  subsections; readable serif or monospace-inspired body text; crisp mathematical
  notation and tabular monospace digits where appropriate.
- **Palette:** deep navy primary text, muted blue-gray secondary text, and limited muted
  amber, green, blue, purple, or occasional red accents. Treat these as semantic token
  roles, not permission to scatter new hex values through components.
- **Structure and controls:** rectangular, thinly bordered frames, technical rules,
  separators, boxed sections, table-like organization, and subtle inset or beveled
  controls. Use restrained CRT-era references, early-computing iconography, or framed
  headers only when they support hierarchy.
- **Anti-goals:** glossy SaaS chrome, gradient-heavy hero sections, glassmorphism,
  blob illustrations, oversized rounded cards, excessive softness, startup minimalism,
  and overly playful edtech decoration.

Texture, bevels, and period references are decorative. They must not obscure content,
create noise behind small text, imply a state by themselves, or compete with learning.
Keep important notation and labels visually crisp.

## Preserve four qualities

For each proposed design, explain its effect on:

1. **Instructional clarity:** how the hierarchy helps learners understand what to do
   and how values or concepts relate.
2. **Retro educational character:** which restrained worksheet, classroom-software, or
   early-computing cues establish the requested mood.
3. **Technical credibility:** how precise labels, notation, tables, and consistent tokens
   keep the tool trustworthy as a technical reference.
4. **Visual warmth:** how paper tones, typography, and restrained accents feel welcoming
   without reducing legibility.

## Design output

Give a concise, implementable visual specification:

- purpose, learner, and central task,
- information hierarchy and panel/table layout,
- token roles for surface, primary/secondary text, borders, focus, and accents,
- display, body, and technical typography roles,
- important control and content states,
- narrow-screen, zoom, and overflow behaviour,
- accessibility constraints that override any aesthetic choice.

Do not invent measured contrast values. Ask Developer to calculate affected foreground,
background, boundary, and focus pairs against WCAG 2.2 AA thresholds. Do not claim the
interface is accessible based on a visual concept alone.

## Basewise context

When designing this repository's converter, preserve its existing architecture and visual
source of truth as described in `.github/copilot-instructions.md`: shared CSS tokens live
centrally, per-base accents come from `rows` in `src/conversion.ts`, and the fixed
sixteen-position table scrolls horizontally at a 390px viewport instead of collapsing.
Do not prescribe duplicating radix, digit, or accent definitions in components.

## Inspiration and further reading

These references inform the style and process; use them for context rather than copying
their prose, layouts, or assets:

- [History of Computers in Education](https://www.cs.odu.edu/~tkennedy/cs300/development/Public/M06-HistoryOfComputersinEducation/index.html)
  notes the spread of multimedia PCs, CD-ROMs, and computers in classrooms during the
  1990s.
- [In Your Face: The Best of Interactive Interface Design CD-ROM](https://archive.org/details/in_your_face_disc)
  describes a 1996 collection of interactive kiosk, CD-ROM, online, and multimedia work.
- [Microsoft Frontend Design Review skill](https://github.com/microsoft/skills/blob/main/.github/skills/frontend-design-review/SKILL.md)
  is a process reference for establishing aesthetic direction and reviewing design
  quality; its visual recommendations are not this project's style guide.
