# Past Dates Release Approval — Final Gate

## recommendation

**APPROVE**

## blockers

None.

## originalIntent

Ship a current-schedule conference catalog that uses the authoritative UTC deadline instant, omits fully elapsed public dates while retaining audit evidence/history, keeps still-open AoE deadlines visible without placing them on a viewer-local past date, and represents an ongoing conference on today in both list and calendar. The rendered proof must cover 375px, 768px, and 1280px with correct Korean wrapping, live semantic DOM, shared design tokens, and visible August 19 ongoing-state evidence.

## desiredOutcome

- Exact `dueAtUtc` cutoff governs public deadline visibility.
- A still-open deadline whose source date is locally past is clamped to today in list grouping and calendar.
- A deadline that has expired earlier on the same local date is absent.
- A conference is in progress on its start day and every day through its end day.
- List copy is `학회 진행 중` / `오늘 진행 중`, with no elapsed range.
- Mobile, tablet, and desktop calendar evidence visibly frames August 19 and shows the same ongoing labels; tablet/desktop render each semantic phrase as its own unbroken line.
- Evidence, source history, responsive behavior, CJK layout, live DOM, and token-driven styling remain intact.

## userOutcomeReview

The current implementation satisfies the requested user-visible outcome. `isUpcomingDeadline` compares the authoritative UTC instant. Both `editionAnchorDate` and `calendarEventGroups` filter by that exact predicate, then clamp a still-open display date earlier than local today to today. `isConferenceInProgress` includes equality at the start boundary, and ongoing editions anchor to today. `EditionCard` and both calendar variants render the current-state labels rather than an elapsed range.

The current screenshots visibly confirm the result: `mobile-375-calendar.png`, `tablet-768-calendar.png`, and `desktop-1280-calendar.png` all frame August 19 and show ECAI 2026 as `학회 진행 중` with `오늘 진행 중`. At 768px and 1280px, the two phrases occupy separate unbroken lines. The remaining ten screenshots cover full list, focus, empty, selected evidence, and history states. No CJK orphan, clipping, tofu, overlap, or horizontal overflow is visible.

## criterionReview

- **C1 exact UTC cutoff — PASS.** `apps/web/src/components/edition-dates.ts:48-55,113-120,165-179`; unit boundary at `apps/web/src/components/edition-dates.test.ts:66-97`.
- **C2 still-open AoE past-source-date clamp — PASS.** List anchor clamps at `edition-dates.ts:113-119`; calendar clamps at `edition-dates.ts:165-168`; direct unit proof at `edition-dates.test.ts:99-122`.
- **C3 same-day expired hidden — PASS.** Exact-instant filtering removes the deadline; start-day fixture at `edition-dates.test.ts:66-91`; browser absence assertion at `apps/web/e2e/catalog.spec.ts:45-52`.
- **C4 start-day and ongoing today labels — PASS.** Inclusive boundary at `edition-dates.ts:63-69`; list at `EditionCard.tsx:50-54`; calendar model at `edition-dates.ts:180-199`.
- **C5 desktop/tablet unbroken semantic lines — PASS.** Separate span nodes at `CalendarView.tsx:147-151`, supported by `apps/web/src/styles/app.css`; directly visible in both current calendar PNGs.
- **C6 screenshot framing on August 19 — PASS.** All three current calendar PNGs visibly include day 19 and the ongoing event.
- **C7 evidence/history/CJK/responsive/token DOM — PASS.** All 13 PNGs inspected directly; evidence and history are visible in mobile selected/history and tablet/desktop rail states. Source is a live React tree with semantic list/table/button/link elements; no screenshot/image/canvas substitute or CSS background-image fake was found. Styling remains routed through shared tokens.
- **C8 runtime/build — PASS.** Current `.omo/evidence/browser/past-dates-playwright.json` records 3 expected, 0 unexpected, 0 flaky and postdates the changed source. Independent `bun run doctor` reproduced typecheck, lint, 27 core tests, web tests, design verification, and production build success; direct `bun --filter @conf/web test` and `bun run build` also exited 0. `git diff --check` is clean.

## programmingAndSlopReview

Directly applied the `omo:programming` and `omo:remove-ai-slops` criteria to the full changed TypeScript/TSX diff, tests, and production code.

- No needless wrapper, speculative abstraction, broad exception handling, dead code, debug output, duplicated per-caller workaround, boundary violation, or untyped escape was introduced.
- The shared root-cause behavior resides in `edition-dates.ts` and is consumed consistently by list grouping and calendar rendering.
- The tests assert observable schedule outputs and rendered DOM behavior. They are not deletion-only tests, tautological tests, prose pins, or implementation-mirroring tests. In particular, the AoE fixture independently distinguishes exact UTC openness from the source display date and fails if the clamp is removed.
- No changed module exceeds the 250 pure-LOC ceiling (`edition-dates.ts`: 205, `CalendarView.tsx`: 197, `App.tsx`: 244). The 244-line `App.tsx` proximity is a note only and violates no stated success criterion.

## checkedArtifacts

- `DESIGN.md`
- Current `git diff`, `git status --short`, and `git diff --check`
- `apps/web/src/App.tsx`
- `apps/web/src/components/EditionCard.tsx`
- `apps/web/src/components/EditionResults.tsx`
- `apps/web/src/components/CalendarView.tsx`
- `apps/web/src/components/edition-dates.ts`
- `apps/web/src/components/edition-dates.test.ts`
- `apps/web/src/styles/app.css`
- `apps/web/src/styles/tokens.css`
- `apps/web/e2e/catalog.spec.ts`
- `.omo/evidence/browser/past-dates-playwright.json`
- `.omo/evidence/browser/mobile-375-focus.png`
- `.omo/evidence/browser/mobile-375-calendar.png`
- `.omo/evidence/browser/mobile-375-empty.png`
- `.omo/evidence/browser/mobile-375.png`
- `.omo/evidence/browser/mobile-375-history.png`
- `.omo/evidence/browser/tablet-768-focus.png`
- `.omo/evidence/browser/tablet-768-calendar.png`
- `.omo/evidence/browser/tablet-768-empty.png`
- `.omo/evidence/browser/tablet-768.png`
- `.omo/evidence/browser/desktop-1280-focus.png`
- `.omo/evidence/browser/desktop-1280-calendar.png`
- `.omo/evidence/browser/desktop-1280-empty.png`
- `.omo/evidence/browser/desktop-1280.png`

## exactEvidenceGaps

None against the stated release criteria. Older REQUEST_CHANGES/REJECT artifacts describe superseded source or screenshots; the current 11:39 capture set, current 3/3 Playwright JSON, and reproduced green doctor/build resolve their cited blockers.
