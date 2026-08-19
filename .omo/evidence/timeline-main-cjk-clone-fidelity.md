# Clone / Design-System Fidelity Review — timeline-main-cjk

**Recommendation:** REQUEST_CHANGES

## Scope and outcome

Goal reviewed: make Timeline the first/default main view and use the full desktop catalog width before a schedule is selected, across 375px, 768px, and 1280px in light and dark modes.

The implementation is a live React/CSS component system, not a screenshot or raster substitute. Its visible Korean wrapping, default active tab, focus treatment, horizontal-pan cue, month axis, dark-mode contrast, and removal of the empty desktop evidence rail are sound in the supplied fresh captures. One explicit responsive content contract is nevertheless broken for long official URLs at mobile width.

## Evidence inspected

- `DESIGN.md` — TimelineBoard source-address and responsive contracts (lines 184-193).
- `apps/web/src/App.tsx` — initial Timeline state and selection layout state (lines 23-45, 206-266).
- `apps/web/src/components/Primitives.tsx` — shared tabs, first-tab order, and keyboard navigation (lines 45-114).
- `apps/web/src/components/TimelineView.tsx` — live DOM board, native buttons/links, labels, and official URL rendering (lines 80-225).
- `apps/web/src/styles/app.css` — token-driven timeline/desktop layout and no-selection rail suppression (lines 1084-1309, 1408-1473).
- `apps/web/src/styles/responsive.css` — mobile URL presentation rule (lines 229-250).
- `data/seed/catalog-state.json` — AICAS 2027 has a 113-character official URL (lines 248-256).
- `apps/web/e2e/catalog.spec.ts` — default-tab/rail assertions and current short-URL coverage (lines 6-13, 54-86, 111-127).
- Fresh, valid RGB PNG captures, all newer than the modified rendered source:
  - `.omo/evidence/browser/mobile-375-{timeline,timeline-focused,dark}.png` (375x812)
  - `.omo/evidence/browser/tablet-768-{timeline,timeline-focused,dark}.png` (768x900)
  - `.omo/evidence/browser/desktop-1280-{timeline,timeline-focused,dark}.png` (1280x900)
- `.omo/evidence/browser/timeline-main-playwright.json` — three expected Playwright projects, zero unexpected failures.

## Findings

### CRITICAL

None. The board is live DOM assembled from reusable React components and CSS tokens; no raster, screenshot, canvas substitute, or `background-image` UI implementation was found.

### HIGH

1. **Mobile official URLs are intentionally truncated, violating the TimelineBoard contract.** `DESIGN.md:192` requires each row's official URL to wrap without ellipsis/truncation. At `<=640px`, `apps/web/src/styles/responsive.css:244-249` turns the URL span into a two-line `-webkit-line-clamp`, so the full displayed address is clipped for long URLs. The current catalog contains AICAS 2027's 113-character address at `data/seed/catalog-state.json:255`; it cannot fit in that two-line, 176px identity column. The supplied MICRO focused capture happens to fit in two lines, so it does not exercise this required long-URL stress case. This makes an evidence-first source address incomplete precisely in the default mobile Timeline.

   Required resolution: render the full address without a line clamp at mobile width and recapture/test the long AICAS URL at 375px.

### MEDIUM

None.

### LOW

None.

## Verified strengths

- Timeline is the initial view and first shared tab: `App.tsx:33`, `Primitives.tsx:61-112`; all screenshots show the active timeline control.
- Before desktop selection, the 430px evidence rail is removed and the results column spans the full catalog width: `app.css:1462-1473`; the 1280px captures show no empty rail.
- Selection restores the contextual evidence state through `data-has-selection`, without replacing the Timeline component tree: `App.tsx:218-266`.
- The bounded board advertises horizontal movement (`TimelineView.tsx:99`) and scrolls only its viewport (`app.css:1140-1153`); the partial next-month exposure makes continuation clear at 375px/768px.
- CJK text in all nine supplied captures has no orphaned particles, broken glyphs, or visibly unnatural phrase splits. Focused deadline markers have a distinct visible focus ring, and light/dark contrast remains legible.
- CSS relies on declared palette, spacing, type, radius, and timeline tokens from `styles/tokens.css`; no fake or isolated hardcoded visual reconstruction was found in the reviewed change.

## Blockers before approval

1. Remove the mobile two-line truncation of Timeline official URLs and provide fresh 375px evidence for the catalog's long AICAS URL.
