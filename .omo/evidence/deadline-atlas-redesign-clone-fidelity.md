# Deadline Atlas clone / design-system fidelity review

**Recommendation: APPROVE**

## Scope and method

Re-reviewed the corrected working-tree diff and `DESIGN.md` as the target contract. Inspected the current component tree and CSS token layer, then visually inspected the fresh desktop, tablet, and mobile default, dark, calendar, timeline, selected-timeline, empty, evidence, history, and focus/full-list states. This is a redesign without a separate pixel-reference image; fidelity is therefore assessed against the documented design system and its responsive contracts.

## Evidence inspected

- Design contract: `DESIGN.md` (especially lines 95-100, 130-148, 152-210, and 250-273).
- Live UI implementation: `apps/web/src/App.tsx`, `apps/web/src/components/{PageChrome,CatalogControls,EditionResults,EditionCard,EvidencePanel,TimelineView,CalendarView,Primitives}.tsx`, and `apps/web/src/styles/{tokens,app,responsive}.css`.
- Browser captures: `.omo/evidence/browser/{desktop-1280,tablet-768,mobile-375}{,-dark,-focus,-calendar,-timeline,-timeline-focused,-empty}.png`, plus `mobile-375-history.png`.
- Browser test record: `.omo/evidence/browser/deadline-atlas-redesign-playwright.json` (three breakpoint tests passed at 2026-08-19T06:49:34Z). It explicitly exercises the desktop/tablet Timeline and Calendar links (`apps/web/e2e/catalog.spec.ts:13-21`).
- Integrity checks: `git diff --check` returned clean; the source scan found no raster/image element or asset URL standing in for the UI. The only `background-image` is the tokenised hero grid in `apps/web/src/styles/app.css:252`.

## What is substantively correct

- The UI is a real, extensible DOM/component tree. Search/filter controls, semantic view tabs, cards, calendar, timeline, evidence, history, and drawer are rendered by reusable React components; no screenshot or raster background replaces the interface.
- The color, elevation, motion, spacing, and primary type ramp are concentrated in `apps/web/src/styles/tokens.css:1-101` and match the bright, evidence-first system in `DESIGN.md`. The supplied captures show a coherent light/dark surface, bounded timeline overflow, mobile agenda fallback, and a full-width compact evidence sheet.
- Evidence data remains product-facing rather than decorative: the visible panel retains official source, timezone/date context, verification status, evidence observations, and history (`EvidencePanel.tsx:50-207`).
- Accessible cues are present in the inspected source: real buttons/links, tab roles and arrow navigation (`Primitives.tsx:45-114`), skip link, dialog focus containment/Escape/return (`App.tsx:79-120`), status text in addition to color, and `aria-*` labels.

## Findings

### CRITICAL

None.

### HIGH

None. The regenerated screenshots and Playwright JSON (15:49:41-44 local time) postdate the latest relevant UI source change (15:49:18). The central navigation now selects the corresponding product view through `App.tsx:160-166` and `PageChrome.tsx:110-117`, with an exact-link E2E assertion.

### MEDIUM

None. `word-break: keep-all` is now applied to the hero support copy and timeline intro (`apps/web/src/styles/app.css:298-307`, `1268-1274`). The fresh 375px dark and timeline captures show intact `확인하세요`, `않습니다.`, and `비교합니다.` with no syllable split or orphaned ending.

### LOW

1. **[code] The design system is predominantly token-driven, but not yet mechanically complete.** A few visual type/geometry values bypass declared tokens, for example `apps/web/src/styles/app.css:162` (`0.625rem` type), `1464` (`0.5625rem` type), `1610` (`0.625rem` radius), and `apps/web/src/styles/responsive.css:146` (mobile hero clamp) / `166` (input radius). This is not visually incoherent or a release blocker, but it weakens the stated "every color, font size, spacing value" traceability in `DESIGN.md:207-210` and should be normalised in a follow-up.

## Blockers before approval

None.
