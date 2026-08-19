# Clone fidelity review — past-dates-release-approve-cjk

**Recommendation: APPROVE**

## Scope and verdict

The current build is a real, token-driven React implementation, not a raster or screenshot substitute. The public current-schedule filter hides fully elapsed editions while preserving the unfiltered edition bundle, evidence, and history. At the captured Aug. 19, 2026 state, ECAI is correctly rendered as an in-progress conference on Aug. 19, with exact Korean labels `학회 진행 중` and `오늘 진행 중`; the elapsed `2026. 8. 18 - 8. 21` range does not reappear in the list or calendar.

## Findings

### CRITICAL

None.

### HIGH

None.

### MEDIUM

None.

### LOW

None.

## Verified details

- **Live component tree / no image fakery:** `EditionResults` selects live `EditionCard` or `CalendarView` render paths; calendar controls, text, links, and evidence rail are semantic DOM. No `background-image`, raster `<img>`, canvas, or data-image substitute appears in `apps/web/src`. See `apps/web/src/components/EditionResults.tsx:14`, `apps/web/src/components/EditionCard.tsx:16`, and `apps/web/src/components/CalendarView.tsx:26`.
- **Token-driven styling:** the added ongoing state uses existing spacing and semantic color tokens (`--space-1`, `--ink-secondary`) in `apps/web/src/styles/app.css:1114`; palette, type, spacing, layout, and radius tokens are centralized in `apps/web/src/styles/tokens.css:1`.
- **Temporal semantics:** deadline eligibility compares the authoritative UTC instant (`dueAtUtc`) at `apps/web/src/components/edition-dates.ts:48`; current/upcoming conference dates use date-only local-day comparison at `:58` and `:63`; default list/calendar inputs are filtered at `:72` and `apps/web/src/App.tsx:109`. The AoE display-date boundary is regression-covered at `apps/web/src/components/edition-dates.test.ts:99`.
- **In-progress rendering:** the list renders the exact Korean pair at `apps/web/src/components/EditionCard.tsx:50`; calendar data emits the pair at `apps/web/src/components/edition-dates.ts:180` and calendar DOM renders separate spans at `apps/web/src/components/CalendarView.tsx:147`. Each desktop/tablet ongoing phrase is protected from mid-phrase wrapping by `white-space: nowrap` at `apps/web/src/styles/app.css:1118`.
- **Evidence/history retained:** source selection still retrieves the original edition plus all its evidence and history at `apps/web/src/api.ts:38` and `apps/web/src/static-catalog.ts:29`; the detail rail exposes all deadlines, evidence, and change history at `apps/web/src/components/EvidencePanel.tsx:91`, `:150`, and `:176`.
- **Visual/CJK audit:** directly opened all 13 current captures: desktop/tablet/mobile default, ECAI calendar, focused full-page, empty-state frames, and mobile history. All are valid PNGs at their stated capture widths, fully composited, and show no overflow, clipping, tofu, or mid-phrase break. The specific desktop/tablet/mobile ECAI calendar frames show both required labels intact, while the old elapsed ECAI range is absent.
- **Behavioral evidence:** `.omo/evidence/browser/past-dates-playwright.json` records 3 expected/3 passed with 0 unexpected and 0 flaky results. `apps/web/e2e/catalog.spec.ts:29`–`:52` asserts the visible in-progress pair and absence of the elapsed range across the three viewport projects.

## Artifacts inspected

- `DESIGN.md:160-179`
- Current git diff and `data/seed/catalog-state.json:1463-1495,6686-6749`
- `apps/web/src/{App.tsx,api.ts,static-catalog.ts,components/EditionResults.tsx,components/EditionCard.tsx,components/CalendarView.tsx,components/edition-dates.ts,components/EvidencePanel.tsx,components/Primitives.tsx,styles/tokens.css,styles/app.css,styles/responsive.css}`
- `apps/web/src/components/edition-dates.test.ts` and `apps/web/e2e/catalog.spec.ts`
- `.omo/evidence/browser/{desktop-1280,tablet-768,mobile-375}{,-calendar,-focus,-empty}.png`
- `.omo/evidence/browser/mobile-375-history.png`
- `.omo/evidence/browser/past-dates-playwright.json`

## Independent review

Two independent read-only passes returned PASS: code/design-system integrity and visual/CJK fidelity. Neither reported a product or evidence blocker.

## Blockers

None.
