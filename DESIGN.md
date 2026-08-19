# Conference Atlas Design System

## 0. Research Log

- Embedded refs: shortlisted Cal.com, Airtable, and Linear -> picked `taste-skill` + Cal.com because a deadline product needs scheduling grammar, scan speed, and monochrome trust more than decorative branding.
- Design read: public research schedule browser for researchers and lab managers, with a precise editorial-product language. Design variance: 5. Motion intensity: 3. Visual density: 6.
- Lazyweb: 3 queries, 4 screens viewed (Acadex, Cal.com Bookings, Rise Calendar, Mixpanel Events) -> took fixed navigation, chronological scan lines, compact filters, selected-row detail, and local empty/filter states. No third-party screenshot ships with the product.
- Imagen drafts: `.omo/evidence/design-research/concept-table-detail.png` and `.omo/evidence/design-research/concept-timeline-drawer.png` -> picked the timeline-drawer draft as the reference-fidelity contract. It makes time the visual spine and keeps official evidence in context.
- UI-UX database: validated a data-dense product pattern, Korean-capable typography, keyboard reachability, explicit no-results recovery, and WCAG contrast. Rejected its generic blue-and-amber palette and serif pairing.
- Interaction research: beui.dev `tabs`, `drawer`, and `button` sources -> adopted a shared active indicator, Escape-close/focus-return drawer behavior, body-scroll locking, clear async states, and reduced-motion fallbacks.
- Content inventory and job order: navigation retains orientation; title/search hooks the task; filters narrow; timeline explains; evidence proves; history compares; calendar reframes; state panels recover.
- Direction: a quiet deadline observatory. The memorable moment is the date spine selecting a deadline while its evidence rail opens beside it, so the user never loses temporal context.

## 1. Atmosphere & Identity

Conference Atlas feels calm, exact, and accountable. It resembles a well-kept research index rather than a marketing dashboard. Paper-toned space and charcoal typography make long sessions comfortable; cobalt appears only where an action or verified link needs attention. The signature is the evidence rail: selecting a deadline connects a point on the chronological spine to its official source, raw wording, and immutable changes without a route reset.

Primary tasks:

1. Find the next relevant submission deadline in under 20 seconds.
2. Confirm what the official page actually said and which timezone applies.
3. Compare an extended date with the previously published value.

Anti-references: generic AI gradients, card mosaics, KPI dashboards, fake charts, decorative status dots, oversized centered heroes, and color without meaning.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
|---|---|---|---|---|
| Canvas | `--canvas` | `#F7F7F3` | `#181916` | Page and scroll background |
| Surface | `--surface` | `#FFFFFF` | `#22231F` | Drawers, fields, selected content |
| Surface muted | `--surface-muted` | `#EFEFEB` | `#2B2D28` | Filters, secondary rows, skeletons |
| Ink | `--ink` | `#20211F` | `#F4F5F0` | Headings and primary body |
| Ink secondary | `--ink-secondary` | `#666B66` | `#B6BAB3` | Metadata and helper text |
| Ink tertiary | `--ink-tertiary` | `#858A84` | `#92978F` | Disabled and low-priority text |
| Rule | `--rule` | `#D9DBD6` | `#3C3F38` | Hairlines and grouped separators |
| Ring | `--ring` | `#C8CBC5` | `#4D5148` | Neutral component containment |
| Interactive | `--interactive` | `#3157D5` | `#8CA5FF` | Links, active navigation, selected spine |
| Interactive soft | `--interactive-soft` | `#E9EEFF` | `#29355A` | Selected rows and active filters |
| Focus ring | `--focus-ring` | `#2147C0` | `#A6B8FF` | Keyboard focus only |
| Verified | `--verified` | `#237A3B` | `#6FC486` | Verified text plus icon label |
| Verified soft | `--verified-soft` | `#E8F4EA` | `#233E2A` | Verified badge surface |
| Warning | `--warning` | `#8A5A00` | `#F1C56A` | Changed or review-needed text |
| Warning soft | `--warning-soft` | `#FFF3D6` | `#493813` | Extended-date surface |
| Danger | `--danger` | `#B42318` | `#FF8B82` | Errors and destructive semantics |
| Danger soft | `--danger-soft` | `#FDECEA` | `#4C2522` | Error-state surface |
| Scrim | `--scrim` | `rgba(32, 33, 31, 0.48)` | `rgba(0, 0, 0, 0.64)` | Mobile drawer isolation |

Rules:

- Accent is functional. It never appears as decoration.
- Verified, warning, and danger always include text or an icon, never color alone.
- Theme switches once at the application root. The visible `ThemeToggle` chooses light or dark, persists that choice locally, and falls back to `prefers-color-scheme` before a choice exists; sections never invert independently.
- Raw color values live only in this file and `apps/web/src/styles/tokens.css`.
- Body contrast target is WCAG 2.2 AA at 4.5:1 minimum; large text and UI graphics meet 3:1.

## 3. Typography

### Font Stack

- Primary: `Pretendard Variable, Pretendard, "Noto Sans KR", system-ui, -apple-system, sans-serif`.
- Mono/data: `ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace`.
- Fonts are local/system only. No remote font request may block Korean text.

### Scale

| Level | Token | Size | Weight | Line height | Usage |
|---|---|---:|---:|---:|---|
| Display | `--text-display` | `clamp(2rem, 4vw, 3.5rem)` | 700 | 1.08 | Page identity |
| H1 | `--text-h1` | `clamp(1.75rem, 3vw, 2.5rem)` | 700 | 1.15 | Route title |
| H2 | `--text-h2` | `1.5rem` | 650 | 1.25 | Panel title |
| H3 | `--text-h3` | `1.125rem` | 650 | 1.35 | Group title |
| Body large | `--text-body-lg` | `1.0625rem` | 400 | 1.6 | Lead guidance |
| Body | `--text-body` | `1rem` | 400 | 1.55 | Default Korean/English text |
| Body small | `--text-body-sm` | `0.875rem` | 400 | 1.5 | Metadata |
| Caption | `--text-caption` | `0.75rem` | 550 | 1.45 | Compact labels |
| Data | `--text-data` | `0.875rem` | 550 | 1.4 | UTC/AoE/date values |

Rules:

- Korean semantic phrases must not be forced into narrow fixed boxes. Labels wrap as units; one-character orphan lines are defects.
- Dates and numeric columns use tabular figures; raw source text uses the primary font for readability.
- Body text never drops below 14px. Inputs render at 16px minimum on mobile to avoid browser zoom.
- Line measures stay between 35-60 characters on mobile and 60-75 on wide reading panels.

## 4. Spacing & Layout

### Spacing and shape

Base unit: 4px.

| Token | Value | Intent |
|---|---:|---|
| `--space-1` | `4px` | Icon and inline detail |
| `--space-2` | `8px` | Compact metadata |
| `--space-3` | `12px` | Row inner gap |
| `--space-4` | `16px` | Mobile gutter and control padding |
| `--space-5` | `20px` | Dense panel padding |
| `--space-6` | `24px` | Standard section gap |
| `--space-8` | `32px` | Route-level grouping |
| `--space-10` | `40px` | Major content separation |
| `--space-12` | `48px` | Page vertical rhythm |
| `--space-16` | `64px` | Wide route breathing room |
| `--radius-control` | `8px` | Inputs, buttons, compact tabs |
| `--radius-panel` | `12px` | Drawers and state panels |
| `--radius-pill` | `999px` | Tags only |
| `--timeline-identity` | `224px` | Sticky conference/source column in the timeline board |
| `--timeline-identity-mobile` | `176px` | Compact sticky identity column at 375px |
| `--timeline-month-width` | `136px` | One readable month track on the timeline axis |
| `--timeline-board-row` | `92px` | Timeline identity and two-lane event row |

### Shell and scroll ownership

- Maximum wide content frame: 1536px. Product content is fluid; readable detail copy stays under 65ch.
- Desktop shell: fixed 208px navigation rail, fluid timeline, 430px evidence rail. The route main owns vertical scrolling; side rails remain sticky inside that document scroll.
- Tablet shell: compact top navigation, fluid timeline, evidence opens as a right drawer. The document remains the only vertical scroll owner.
- Mobile shell: top app bar, single chronological feed, evidence opens as a full-width drawer/sheet. Calendar becomes a chronological agenda, never a squeezed seven-column grid.
- Intrinsic rows use `minmax(min(16rem, 100%), 1fr)` or content-driven columns. Every flex/grid child that may shrink gets `min-inline-size: 0`.
- App height uses `100dvh`, not `100vh`. Primary document content never requires horizontal scrolling. `TimelineBoard` is the sole bounded two-dimensional data viewport and advertises its horizontal pan behavior before the grid.

### Breakpoints

| Width | Contract |
|---:|---|
| 375px | One-column agenda; 16px gutters; 44px controls; evidence sheet; filters in a labelled disclosure |
| 768px | Two-region layout; top navigation; timeline plus overlay drawer; calendar can show a compact month grid |
| 1280px | Persistent navigation and evidence rails; full timeline labels and month grid |

Content stress gates: empty result, 40-character conference name, long Korean track label, unbroken official URL, 200% zoom, system dark mode, and reduced motion must all preserve task completion.

## 5. Components

### AppShell

- Structure: skip link, navigation landmark, header toolbar, `main`, optional contextual rail.
- Variants: wide rail, compact top bar, mobile top bar.
- States: current route, collapsed filters, offline/problem indicator.
- Accessibility: landmarks are named; route changes focus the main heading; navigation items have text labels.
- Layout: fixed-sidenav shell at 1280px, document-scroll shell below it.

### SearchField

- Structure: visible label, search icon, native search input, clear control, helper/result live region.
- States: default, hover, focus, filled, loading, disabled, error.
- Accessibility: 44px minimum target, `type="search"`, labelled clear button, results announced politely.
- Motion: opacity/color transition only; loading does not shift geometry.

### FilterRail

- Structure: labelled group of discipline/year controls, reset action, active-filter summary.
- Variants: persistent rail, horizontal wrapping cluster, mobile disclosure.
- States: default, hover, active, focus, disabled, empty options.
- Accessibility: native buttons/selects; no hover-only choices; active state includes text and `aria-pressed`.

### ViewTabs

- Structure: `tablist`, List, Timeline, and Calendar tabs, linked panels.
- States: default, hover, active, focus, disabled.
- Accessibility: arrow-key support follows WAI-ARIA tabs; inactive content is hidden without losing URL state.
- Motion: beui-inspired shared indicator. Spatial spring is `170 / 24 / 1.2`; reduced motion switches instantly.

### ThemeToggle

- Structure: one icon, one visible current-theme label, and a descriptive next-action accessible name.
- States: light, dark, hover, focus, pressed.
- Accessibility: native button with a 44px target; the label never relies on the sun/moon icon alone.
- Persistence: `conference-atlas-theme` stores only `light` or `dark`; absent state follows the system preference.
- Placement: always visible in the desktop rail and compact header without duplicating an active control in one viewport.

### DeadlineTimeline and DeadlineRow

- Structure: month heading, date marker, deadline button, conference, track, evidence status, and an always-visible official-site link.
- Current-schedule contract: the public catalog includes editions with a future deadline, an upcoming or ongoing conference, or a current/future edition whose dates are still unpublished. Fully elapsed editions stay in the source catalog but are omitted from the default results.
- Milestone visibility: `MilestoneStack` shows the nearest open milestone plus `학회 개최` while the conference is upcoming or in progress. Elapsed dates remain available in `EvidenceDrawer` for auditability but never reappear in the list or calendar.
- Milestone ordering: abstract registration, paper submission, supplementary submission, first notification, rebuttal, final notification, camera ready, then conference dates. The evidence drawer exposes every available milestone rather than selecting only the first deadline.
- Variants: desktop time spine, tablet compact row, mobile agenda.
- States: default, hover, selected, focus, extended, verified, unavailable.
- Accessibility: chronological list semantics; each row has one descriptive accessible name; selected state uses `aria-current` or `aria-selected` as appropriate.
- Layout: timeline is the primary document flow. Date spine is structural, not decorative.
- Source address: every edition exposes its validated official URL without requiring the evidence drawer; long URLs wrap without truncation.

### TimelineBoard and TimelineRow

- Structure: sticky conference identity column, continuous month axis, today rule, one next-submission marker, one conference-period bar, and an always-visible official-site link per row.
- Time window: begins at the current local month and extends through the last visible deadline or conference end. Past portions of ongoing conferences are clipped at today rather than redrawn as future time.
- Semantics: deadline markers read `제출`; interval bars read `학회`. Color, shape, and text all distinguish the two.
- States: default, selected, ongoing, dates-pending, hover, focus.
- Accessibility: the board is a labelled region with a short pan instruction; each row retains a full text summary and native selection button/link controls.
- Responsive: the page never overflows. At 375px and 768px, only the board's labelled track viewport pans horizontally while the identity column remains sticky.
- Source address: every row includes its official URL in the sticky identity area; URLs wrap without ellipsis.

### CalendarGrid

- Structure: month heading, weekday headers, dated cells containing both deadline and conference-event controls, followed by a full-width official-site URL list for that month.
- Event semantics: deadline chips use the visible prefix `제출` or their milestone label; conference chips use `개최`. The distinction is encoded in text and shape as well as color.
- In-progress semantics: after a conference starts and before it ends, list and calendar place it on today as `학회 진행 중 / 오늘 진행 중` instead of reviving the elapsed start date or misclassifying the edition as unpublished.
- Variants: semantic month grid at 768px+, chronological agenda at 375px.
- States: empty day, today, focused day, selected deadline, multiple deadlines.
- Accessibility: if interactive grid keys are implemented, follow ARIA grid; otherwise keep native table/list semantics. Mobile always uses lists.

### EvidenceDrawer

- Structure: dialog heading, close button, accepted deadline, official source, fetch metadata, raw/normalized value, version link.
- Variants: persistent rail at 1280px, modal drawer below 1280px.
- States: closed, opening, open, loading, partial error, no history.
- Accessibility: Escape closes, focus moves inside on open and returns to trigger on close, body scroll locks only for modal variant, `aria-modal` only when overlaid.
- Motion: transform and opacity only; standard duration 180ms or project spring. Reduced motion uses an opacity-only or instant swap.

### Button

- Variants: primary, secondary, ghost, icon with text.
- States: default, hover, active, focus, disabled, loading, success, error.
- Accessibility: one-line label, 44px target, status text announced, disabled semantics.
- Motion: 120ms transform/opacity; active scale 0.98 without moving layout.

### Badge

- Variants: verified, extended, review-needed, timezone-review-needed, source kind, lab tier.
- States: static and linked.
- Accessibility: visible text always accompanies color; decorative dots are prohibited.

### CurationNote

- Structure: compact source label, imported taxonomy summary, and external source link.
- Variants: lab timeline import only; never substitutes for deadline evidence.
- States: static copy plus link hover and keyboard focus.
- Accessibility: the source link has a descriptive label and opens safely in a new tab.

### Surface and StatePanel

- Structure: heading, message, optional supporting detail and recovery action.
- Variants: loading skeleton, empty, partial error, full error, not found.
- States: loading, empty, error, recovering, resolved.
- Accessibility: errors use `role="alert"` only when newly introduced; empty copy is “검색 결과가 없습니다”; retry keeps query state.

### Primitive showcase gate

Before product routes are composed, `/__showcase` in development exercises every primitive at 375px, 768px, and 1280px with default, hover, active, focus, disabled, loading, empty, and error states; long Korean labels; unbroken source URLs; dark mode; keyboard traversal; and reduced motion. The showcase and dev tools never enter the production bundle.

## 6. Motion & Interaction

| Token | Value | Use |
|---|---|---|
| `--duration-micro` | `120ms` | Press, focus, color feedback |
| `--duration-standard` | `180ms` | Tab content and drawer crossfade |
| `--duration-exit` | `120ms` | Fast dismissal |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Enter and emphasis |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | State changes |

Rules:

- Every animation communicates selection, feedback, or spatial continuity. There is no decorative entrance sequence.
- Only `transform`, `opacity`, and short color/filter changes animate. Layout properties never animate.
- Search debounces requests by 200ms but updates immediately on submit; stale requests are aborted.
- Evidence selection keeps the timeline position stable. Closing the drawer restores focus.
- `prefers-reduced-motion: reduce` disables spatial transforms and springs; state remains immediate and perceivable.
- Animations are interruptible and never block pointer, keyboard, or screen-reader interaction.

## 7. Depth & Surface

Strategy: mixed ring-plus-soft elevation, adapted from Cal.com but quieter on dense timeline rows.

| Level | Token | Treatment | Usage |
|---|---|---|---|
| Flat | `--shadow-flat` | none | Canvas, timeline groups |
| Ring | `--shadow-ring` | 0 0 0 1px semantic ring | Inputs, compact controls |
| Surface | `--shadow-surface` | ring + contact + soft ambient layer | Evidence rail and state panel |
| Overlay | `--shadow-overlay` | ring + deeper soft ambient layer | Modal drawer only |

Rules:

- Timeline rows use whitespace and one bottom rule, not cards around every record.
- Selected state uses `--interactive-soft` plus a stronger semantic ring. It does not lift or glow.
- Shadow colors are tokenized in `tokens.css`; no pure-black heavy drop shadow is allowed.
- Dark mode preserves hierarchy with tonal surfaces and restrained shadows.

## 8. Accessibility Constraints & Accepted Debt

### Inclusive personas

1. Korean graduate researcher: checks a deadline one-handed on a 375px phone under time pressure. Pass if search, filter, next deadline, timezone, and source are reachable without horizontal scroll or precision taps.
2. lab manager: compares multiple tracks and changes on a 1280px desktop. Pass if scanning, list/calendar switching, and evidence comparison preserve filters and context.
3. low-vision keyboard researcher: uses 200% zoom, keyboard-only navigation, dark preference, and reduced motion. Pass if all tasks complete with visible focus, correct reading order, reflow, no motion dependence, and no clipped CJK.

### Constraints

- WCAG target: 2.2 AA. Body contrast 4.5:1, large text and UI graphics 3:1, visible 2px+ focus treatment.
- Touch targets are at least 44px by 44px with 8px separation where adjacent.
- Keyboard path covers skip link, search, filters, view tabs, deadlines, evidence, close, and retry without traps.
- Source links include descriptive names and safe external-link behavior. Icons never carry the full meaning alone.
- Dates expose UTC and the source timezone label. Color never carries verified/extended/change meaning alone.
- Search and error changes are announced through restrained live regions. Static error text is not repeatedly announced.
- 200% zoom and 375px reflow to one readable column. No two-dimensional scrolling of primary content.
- Korean/CJK text must not clip, produce tofu, or strand a particle/ending on its own line due to an unnecessarily narrow container.
- Dark mode, reduced motion, high text scaling, slow network, empty catalog, malformed response, partial evidence failure, and long content are implementation test states.

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
|---|---|---|---|
| None | None | No accepted debt | Closed |
