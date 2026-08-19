# Timeline Main Release Gate

- recommendation: APPROVE
- verdict: PASS
- blockers: []

## Original intent

Make Timeline the first and initial catalog view; give the unselected desktop Timeline the full content width; show evidence context only after selection; retain accessible List/Calendar navigation; and display complete official URLs on mobile without truncation.

## Desired outcome

At 375px, 768px, and 1280px, users land on a semantic Timeline tab and live Timeline panel. The 1280px unselected state has no empty evidence rail. Selecting a schedule restores the contextual evidence surface. Keyboard users can move cyclically among Timeline, List, and Calendar. Official URL text wraps naturally at mobile width instead of being line-clamped.

## User outcome review

PASS. `App.tsx` initializes `view` to `timeline`; `ViewTabs` renders Timeline first and uses the same order for ArrowLeft/ArrowRight navigation. The desktop-only CSS collapses the catalog to one column and hides the evidence panel only for the unselected Timeline state; `data-has-selection` restores the two-column layout after selection. List and Calendar remain semantic tabs connected to the active tabpanel, and the current E2E scenario exercises both keyboard transitions and visible List/Calendar outcomes. The mobile URL rule now contains only normal white-space and `overflow-wrap:anywhere`; the previous two-line WebKit clamp is absent. Fresh 375px focused evidence visibly shows the complete MICRO URL across wrapped lines.

## Criterion review

- C1 Timeline first/default: PASS — `apps/web/src/App.tsx:33`; `apps/web/src/components/Primitives.tsx:61-112`; `.omo/evidence/browser/timeline-main-playwright.json` asserts the selected Timeline tab and visible Timeline region in all three projects.
- C2 full-width desktop unselected state: PASS — `apps/web/src/styles/app.css:1462-1473`; `.omo/evidence/browser/desktop-1280-timeline.png` shows the board occupying the catalog width with no empty evidence rail.
- C3 contextual evidence after selection: PASS — `apps/web/src/App.tsx:218-266`; `.omo/evidence/browser/desktop-1280.png` shows List selection with the evidence rail restored, while `desktop-1280-timeline-focused.png` preserves Timeline position and content.
- C4 List/Calendar accessibility: PASS — semantic `tablist`/`tab`/`tabpanel`, `aria-selected`, `aria-controls`, roving `tabIndex`, and cyclic ArrowLeft/ArrowRight behavior are present in `Primitives.tsx:58-113` and `App.tsx:218-232`; E2E lines 56-97 exercise Timeline and Calendar keyboard transitions and lines 119-133 exercise List selection.
- C5 mobile official URLs do not truncate: PASS — `apps/web/src/styles/responsive.css:241-247` has no clamp, ellipsis, hidden overflow, or fixed line limit; `apps/web/src/styles/app.css:1232-1247` renders a wrapping link; `mobile-375-timeline-focused.png` visibly contains the complete MICRO address.
- C6 current browser evidence: PASS — `.omo/evidence/browser/timeline-main-playwright.json` records 3 expected, 0 unexpected, 0 flaky; screenshots and JSON are timestamped 2026-08-19 15:16 KST and postdate the clamp fix.

## Direct programming and remove-ai-slops pass

The changed production code is a minimal state/order/layout correction plus deletion of the obsolete clamp. No new abstraction, parser, normalization, dependency, defensive branch, debug code, duplicated implementation, or implementation-mirroring helper was added. Tests assert observable selected-tab, visible-region, evidence-rail, keyboard, and user-flow outcomes; they are not deletion-only or prose/string-removal tests. The E2E URL assertion uses MICRO rather than the catalog's longest AICAS URL, but the universal CSS removal is directly inspectable and the current success criteria do not require a named long-URL fixture.

`App.tsx` measures 261 pure LOC, above the programming/remove-ai-slops 250-LOC guideline, but this is pre-existing architecture and the current two-line change does not create or worsen it. It is a NOTE, not a blocker against any stated release criterion.

## Checked artifacts

- `/local_data/conf_web/DESIGN.md`
- `/local_data/conf_web/apps/web/src/App.tsx`
- `/local_data/conf_web/apps/web/src/components/Primitives.tsx`
- `/local_data/conf_web/apps/web/src/components/TimelineView.tsx`
- `/local_data/conf_web/apps/web/src/styles/app.css`
- `/local_data/conf_web/apps/web/src/styles/responsive.css`
- `/local_data/conf_web/apps/web/src/App.test.tsx`
- `/local_data/conf_web/apps/web/e2e/catalog.spec.ts`
- `/local_data/conf_web/.omo/evidence/browser/timeline-main-playwright.json`
- `/local_data/conf_web/.omo/evidence/browser/mobile-375-timeline.png`
- `/local_data/conf_web/.omo/evidence/browser/mobile-375-timeline-focused.png`
- `/local_data/conf_web/.omo/evidence/browser/mobile-375-calendar.png`
- `/local_data/conf_web/.omo/evidence/browser/desktop-1280-timeline.png`
- `/local_data/conf_web/.omo/evidence/browser/desktop-1280-timeline-focused.png`
- `/local_data/conf_web/.omo/evidence/browser/desktop-1280.png`
- `/local_data/conf_web/.omo/evidence/timeline-main-cjk-clone-fidelity.md`

## Exact evidence gaps and notes

- No fresh `bun run doctor` or standalone production-build log accompanies the 15:16 clamp-removal rerun. Older release evidence reports doctor/build success, but it predates this final CSS deletion and is not treated as current proof. This does not block the stated gate because fresh current Playwright evidence exists and the final change is removal of a presentation clamp.
- The pre-fix fidelity report still says `REQUEST_CHANGES`; its sole HIGH finding cites the now-deleted line clamp. It is superseded by the current diff and fresh screenshots, not used as approval evidence.
- No screenshot targets the longest AICAS URL. The current mobile capture proves multiline URL display with MICRO, while the source proves there is no remaining line-count clamp.
