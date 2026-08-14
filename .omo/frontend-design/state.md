# Frontend Design State

## Current Objective

Build a provenance-first Korean conference deadline browser that lets researchers find, verify, and compare dates through a responsive timeline.

## Locked Decisions

- Product direction: timeline-first public research index with in-context evidence rail.
- Visual system: Cal.com-inspired monochrome restraint, paper canvas, charcoal typography, restrained cobalt interaction color.
- Reference contract: `.omo/evidence/design-research/concept-timeline-drawer.png`.
- Design dials: variance 5, motion 3, density 6.
- System/local Korean-capable fonts only; no remote font dependency.
- One document scroll owner; modal evidence drawer below 1280px; persistent rail at 1280px.
- Accessibility outranks density or reference fidelity.

## Source Inputs

- `DESIGN.md`
- `.omo/plans/conference-deadline-platform.md`
- `.omo/evidence/design-research/concept-table-detail.png`
- `.omo/evidence/design-research/concept-timeline-drawer.png`
- Cal.com packaged reference and public scheduling grammar
- Lazyweb screens viewed in temporary research storage only
- beui.dev tabs/drawer/button source mechanisms
- UI-UX database typography and accessibility results

## Design Brief

- Audience: Korean graduate researchers, lab managers, and accessibility-sensitive researchers.
- Journey: search -> narrow -> scan date spine -> select deadline -> confirm source/AoE -> compare change.
- Tone: plain Korean, factual, no promotional filler.
- Principle: show the accepted date first, but keep its official wording and history one action away.
- Anti-references: KPI dashboards, generic AI gradients, fake charts, dense card mosaics, decorative animation.

## Inclusive Personas

- Korean graduate researcher: one-handed 375px task, time pressure, needs immediate timezone clarity.
- Lab manager: 1280px comparison task, multiple tracks, needs stable filters and version history.
- Low-vision keyboard researcher: 200% zoom, keyboard-only, reduced motion, needs reflow and visible focus.

## Adaptive Preferences

- System light/dark colors, reduced motion, 200% zoom, Korean line breaking, keyboard and screen-reader flow.
- Mobile calendar becomes an agenda. Evidence becomes a focus-managed modal drawer.

## Verification Matrix

- Design contract RED/GREEN: `.omo/evidence/red-green/design-contract-red.txt` and green counterpart.
- Primitive showcase: 375/768/1280, dark mode, reduced motion, keyboard, long CJK, unbroken URL.
- Product routes: list, calendar, detail, empty, malformed, partial evidence, history.
- Final visual QA: fresh complete screenshots plus dual independent reviewers.
- Final implementation review: current diff, build/test evidence, persona walk-through, debt register.

## Design Debt Register

| ID | Source | Severity | Issue | Affected users | Suggested fix | Status | Notes |
|---|---|---|---|---|---|---|---|
| None | None | None | No accepted debt | None | None | Closed | Initial state |

## Evidence Index

- Plan: `.omo/plans/conference-deadline-platform.md`
- Selected concept: `.omo/evidence/design-research/concept-timeline-drawer.png`
- Alternate concept: `.omo/evidence/design-research/concept-table-detail.png`
- Ultrawork notepad: `/tmp/ulw-20260814-120745.56uzCe.md`

## Handoff Notes

- Implement primitives before product screens.
- Preserve the timeline/evidence connection across all breakpoints.
- Do not expose unreviewed or ambiguous observations in the public UI.
- Update this file with fresh QA artifacts and any debt decision after review.
