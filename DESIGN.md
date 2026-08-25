# IRIS Conference Deadline Design System

## 0. Research Log

- Brief: transform the existing conference catalog into a trusted research deadline product while preserving search, field filters, list/timeline/calendar views, evidence, history, keyboard behavior, data fetching, and responsive behavior.
- Existing-surface audit: the beige canvas, fixed 208px side rail, database-like row density, all-caps labels, and raw official URLs made the product feel like an internal registry. The strong parts to preserve are the evidence-first information model, timeline-default behavior, accessible drawer, source provenance, and restrained motion.
- Layer A: `redesign-skill.md` supplied the audit-first approach, removal of the unnecessary sidebar, stronger display hierarchy, asymmetric whitespace, deliberate elevation, complete loading/empty/error states, and interaction feedback.
- Layer B: `linear.app.md` supplied information hierarchy, compressed display tracking, precise active states, quiet borders, and sparse accent use. Its dark-first palette and brand violet were explicitly rejected because this product requires a bright research-tool surface and the brief supplies a blue system.
- Interaction research: beui.dev `input`, `tabs`, `drawer`, and `button` sources were inspected. Adopted mechanisms are a 180–200ms input focus transition, a scoped active-tab indicator, transform/opacity drawer movement with an opacity-only reduced-motion fallback, and 0.98 press feedback.
- Direction: a bright research deadline atlas. The signature moment is the large search command floating in a pale-blue horizon, followed immediately by a spacious temporal product surface where verified source evidence is always one deliberate action away.
- Design variance: 5. Motion intensity: 3. Visual density: 6.

## 1. Atmosphere & Identity

`IRIS Conference Deadline` is a calm, precise, and approachable research product. It must read as “A trusted research deadline tracker,” not a lab database or a marketing-only landing page.

Identity keywords: precise, reliable, calm, modern, academic, intelligent.

The product combines:

- bright, generous product surfaces and friendly control geometry;
- Linear-like information hierarchy and typographic precision;
- academic trust through visible verified-source, evidence, timezone, and history language;
- a restrained blue interaction accent, with a muted five-color taxonomy palette for research fields and green reserved for verification.

The public name and tagline are defined once in `apps/web/src/brand.ts`:

- Name: `IRIS Conference Deadline`
- Tagline: `Verified conference timelines.`

Primary decision path:

1. Understand the product within five seconds.
2. Search in the hero or choose a research field beside the product view controls.
3. Compare upcoming dates in Timeline, List, or Calendar.
4. Open one conference and verify the official source, evidence, and change history.

Anti-references: fixed sidebars for one-route navigation, beige database chrome, dense spreadsheet rows, raw URLs as primary list content, KPI card dashboards, strong gradients, heavy glass, neon, 3D decoration, and motion without meaning.

## 2. Color

All raw color values live only here and in `apps/web/src/styles/tokens.css`.

| Role | Token | Light | Dark | Usage |
|---|---|---|---|---|
| Page | `--bg-page` | `#F7F9FC` | `#11151C` | Document background |
| Surface | `--bg-surface` | `#FFFFFF` | `#191F28` | Cards, navbar, evidence |
| Soft | `--bg-soft` | `#F2F6FC` | `#202733` | Quiet grouped regions |
| Blue soft | `--bg-blue-soft` | `#EDF5FF` | `#172747` | Selected and branded soft surfaces |
| Primary | `--primary` | `#3478F6` | `#6D9EFF` | Active tabs, important links, deadline marker |
| Primary hover | `--primary-hover` | `#2468E5` | `#8AB0FF` | Hover/pressed emphasis |
| Primary soft | `--primary-soft` | `#EAF2FF` | `#20355C` | Active filters and subtle selection |
| Text primary | `--text-primary` | `#191F28` | `#F4F7FB` | Headings and primary content |
| Text secondary | `--text-secondary` | `#4E5968` | `#C1C8D2` | Body and metadata |
| Text tertiary | `--text-tertiary` | `#8B95A1` | `#8F9AA8` | Hints and low-priority labels |
| Border | `--border-default` | `#E5E8EB` | `#343D4A` | Inputs and elevated surfaces |
| Border soft | `--border-soft` | `#F0F2F5` | `#29323E` | Quiet division |
| Success | `--success` | `#168A52` | `#5FD29A` | Verification only |
| Success soft | `--success-soft` | `#EAFBF2` | `#173B2B` | Verified badge |
| Warning | `--warning` | `#A66500` | `#FFBE55` | Review and near deadline |
| Warning soft | `--warning-soft` | `#FFF7E6` | `#443315` | Review surface |
| Danger | `--danger` | `#D93443` | `#FF818C` | Three-day countdown and errors |
| Danger soft | `--danger-soft` | `#FFF0F1` | `#4A2229` | Urgent pill/error surface |
| Purple | `--purple` | `#7950F2` | `#A58AFF` | Change-history accents only |
| Purple soft | `--purple-soft` | `#F3F0FF` | `#312850` | Change-history surface |
| Circuit | `--field-circuit` | `#9A5A00` | `#FFB65E` | Circuit taxonomy accent |
| Circuit soft | `--field-circuit-soft` | `#FFF3E3` | `#402B17` | Circuit taxonomy surface |
| AI | `--field-ai` | `#4E5DC7` | `#A8B3FF` | AI taxonomy accent |
| AI soft | `--field-ai-soft` | `#EEF0FF` | `#292E52` | AI taxonomy surface |
| System | `--field-system` | `#087A78` | `#62D2CC` | System taxonomy accent |
| System soft | `--field-system-soft` | `#E7F8F6` | `#173B3A` | System taxonomy surface |
| Architecture | `--field-archi` | `#366CAF` | `#8DB8F2` | Architecture taxonomy accent |
| Architecture soft | `--field-archi-soft` | `#EAF3FF` | `#203550` | Architecture taxonomy surface |
| Computer vision | `--field-cv` | `#B13E68` | `#FF94B9` | CV taxonomy accent |
| Computer vision soft | `--field-cv-soft` | `#FDECF3` | `#472432` | CV taxonomy surface |
| Focus | `--focus-ring` | `#1D5FD3` | `#9AB8FF` | Keyboard focus |
| Scrim | `--scrim` | `rgba(25,31,40,.42)` | `rgba(0,0,0,.66)` | Compact evidence isolation |

Rules:

- Blue is limited to selection, links, primary deadlines, and active controls; the taxonomy palette is limited to field identification.
- Green is verification-only. Purple is history-only. Warning and danger always include text.
- Circuit, AI, System, Archi, and CV use amber, indigo, teal, steel-blue, and rose respectively. Unknown categories fall back to neutral tokens.
- Multi-field cards render one label per field. Single-accent spatial surfaces use the first listed field as the edition's primary taxonomy.
- Taxonomy color is always paired with a visible category label, acronym, or filter name; it never carries meaning alone.
- No component introduces a raw hex, rgb, or ad-hoc semantic color.
- Body text meets WCAG 2.2 AA 4.5:1; large text and UI graphics meet 3:1.

## 3. Typography

Primary stack: `Pretendard Variable, Pretendard, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

Data stack: `ui-monospace, "SFMono-Regular", Consolas, monospace`.

| Role | Token | Size | Weight | Line height | Tracking |
|---|---|---:|---:|---:|---:|
| Hero | `--text-hero` | `clamp(2.625rem, 6vw, 3.75rem)` | 720 | 1.04 | `-0.045em` |
| Page H1 | `--text-h1` | `clamp(2rem, 4vw, 2.75rem)` | 700 | 1.12 | `-0.035em` |
| Section | `--text-section` | `clamp(1.5rem, 2.4vw, 1.875rem)` | 700 | 1.2 | `-0.025em` |
| Conference | `--text-conference` | `clamp(1.1875rem, 2vw, 1.375rem)` | 700 | 1.25 | `-0.018em` |
| Body large | `--text-body-lg` | `1.0625rem` | 450 | 1.65 | `-0.01em` |
| Body | `--text-body` | `1rem` | 450 | 1.55 | `-0.006em` |
| Body small | `--text-body-sm` | `0.875rem` | 450 | 1.5 | `0` |
| Label | `--text-label` | `0.8125rem` | 620 | 1.4 | `-0.005em` |
| Caption | `--text-caption` | `0.75rem` | 550 | 1.4 | `0` |
| Data | `--text-data` | `0.875rem` | 620 | 1.4 | `0` |

Rules:

- Hero copy is centered but product headers are left-aligned.
- Display text uses balanced wrapping. Korean body text uses pretty wrapping and never strands one-character particles or endings due to narrow containers.
- Dates and D-Day values use tabular numbers.
- Body text never drops below 14px; mobile inputs are 16px minimum.

## 4. Spacing & Layout

Base unit: 4px.

| Token | Value | Usage |
|---|---:|---|
| `--space-1` | `4px` | Micro gap |
| `--space-2` | `8px` | Inline icon gap |
| `--space-3` | `12px` | Compact grouping |
| `--space-4` | `16px` | Mobile gutter/card gap |
| `--space-5` | `20px` | Compact card padding |
| `--space-6` | `24px` | Standard card padding |
| `--space-8` | `32px` | Container gutter and section grouping |
| `--space-10` | `40px` | Product grouping |
| `--space-12` | `48px` | Section separation |
| `--space-16` | `64px` | Hero and wide whitespace |
| `--space-20` | `80px` | Desktop hero rhythm |
| `--radius-control` | `14px` | Buttons and compact controls |
| `--radius-input` | `20px` | Hero search |
| `--radius-card` | `20px` | Conference and evidence cards |
| `--radius-panel` | `24px` | Large product panels |
| `--radius-pill` | `999px` | Chips and status only |
| `--container` | `1220px` | Navbar, hero, and product alignment |
| `--timeline-identity` | `240px` | Sticky timeline identity |
| `--timeline-identity-mobile` | `176px` | Mobile identity |
| `--timeline-month-width` | `144px` | Month axis |
| `--timeline-board-row` | `104px` | Spacious timeline row |
| `--timeline-conference-min-width` | `52px` | Complete short conference marker label |

Shell:

- The fixed desktop sidebar is removed. One sticky top navbar spans the page and aligns to `--container`.
- The navbar is 68px high, translucent only enough to retain context, with a subtle scrolled-style border.
- Hero is 450–550px on desktop, uses a pale-blue radial atmosphere, and contains the primary search; field filters live with the product view controls below.
- Product content begins immediately after the hero. Main width is `--container`, with 32px desktop, 24px tablet, and 16px mobile gutters.
- Evidence is a 390–420px contextual side panel on desktop and an overlay drawer below 1280px.
- Primary document content never scrolls horizontally. Timeline is the only bounded horizontal data viewport.
- Use `100dvh`, never `100vh`.

Breakpoints:

| Width | Contract |
|---:|---|
| 375px | Compact top navbar, 32–44px hero title, horizontal filter chips, one-column cards, full-width evidence sheet |
| 768px | Full top navbar, one-column cards, wrapped chips, timeline viewport, right evidence drawer |
| 1280px | Wide product container, full-width timeline until selection, contextual evidence column after selection |

Stress gates: 200% zoom, reduced motion, dark mode, empty/error/loading, 40-character name, long Korean track, long official URL, pending dates, and keyboard-only operation.

## 5. Components

### TopNavbar

- Sticky 68px surface, brand name/tagline at left, `Explore`, `Timeline`, `Calendar` navigation in the center, and the theme action at right.
- No desktop sidebar or duplicate active navigation.
- Compact mobile layout keeps brand and actions; secondary nav remains horizontally reachable without a menu trap.

### HeroSearch

- Visible hero title is omitted; a screen-reader-only H1 identifies `IRIS Conference Deadline 학회 일정`.
- Korean support copy explains official sources and evidence.
- Search is the focal floating surface, 60–64px high, max 780px, with a left icon and visible shortcut hint.
- States: idle, hover, focus, filled, loading, error. Focus uses primary border plus a soft blue halo without layout shift.

### FilterChip

- Pill buttons remain native controls with `aria-pressed`.
- Inactive chips show a small field-color dot on white/quiet-border/secondary text. Active field chips use their soft taxonomy surface and accent text; `All` remains primary blue.
- Field filters live with the Timeline/List/Calendar view controls in the product header, not in the discovery hero.
- Mobile uses a labelled horizontal scroller; filters never collapse behind an ambiguous disclosure.

### TrustStrip

- One quiet line beneath search: conference count, verified official sources, and operator-curated status.
- Internal Notion/lab sync moves to the footer/data-source note.

### ProductHeader and ViewSwitcher

- Left: `Upcoming deadlines` plus short Korean guidance. Right: Timeline/List/Calendar semantic tabs with the field-filter row directly beneath.
- Active state is a scoped blue-soft pill/indicator; keyboard arrow behavior and tab/panel relations remain intact.
- With `All` selected, Timeline and List group conferences by AI, System, CV, Circuit, and Archi. Each field is ordered by its nearest next deadline or conference date; a multi-field conference appears once under its primary field. Each field header is a native disclosure, open by default, so researchers can collapse completed comparisons without losing the shared timeline axis. Calendar stays globally chronological.

### ConferenceCard and DeadlineBadge

- Card anatomy: acronym/name, deadline countdown, next milestone/date, categories/tier/location, verification, hostname source link.
- A slim primary-taxonomy rail and individually colored field labels distinguish mixed-category cards without recoloring deadline urgency or verification status.
- Conference acronyms use their primary taxonomy accent in cards, timeline identities, calendar events/source lists, and evidence headings; surrounding names and metadata remain neutral.
- Radius 20px, 22–26px padding, quiet border, near-invisible base shadow. Hover raises an interactive card by 2px with stronger blue-tinted elevation.
- Countdown text: `D-n`, `TODAY`, `CLOSED`, or `TBD`. 30+ days blue, 8–30 neutral-blue, 4–7 warning, 0–3 danger, closed gray.
- Full raw URLs are omitted from list cards but remain available in timeline identity, calendar source groups, and evidence detail.

### EvidencePanel and EvidenceCard

- Evidence is product information, not debug output. Header emphasizes acronym and verification.
- Separate soft sub-cards for primary schedule, official source, evidence observations, and change history.
- Green appears only on verified labels; purple appears only on change history.
- Compact drawer preserves Escape close, focus trap/return, scroll lock, and reduced-motion behavior.

### TimelineBoard

- Preserve sticky conference column and month-axis data logic.
- Use spacious rows, subtle month bands, field-colored deadline markers and conference bars, and one clear today rule with a `TODAY` label. Shape and text continue to distinguish submission from conference duration. Short conference markers use the minimum label width; markers ending at the time-axis boundary align inward so their complete label stays visible.
- Hover/selection highlights a real selectable row. Official URL remains visible and may wrap.
- In the `All` view, restrained field headers separate the row groups while the shared horizontal date axis remains unchanged.

### CalendarGrid

- Preserve native table semantics at 768px+ and agenda fallback at 375px.
- Increase cell breathing room, render events with field-colored soft pills, retain explicit `일정`/`개최` text, and clearly label today.
- Month source lists remain available below each month.

### Shared primitives

- `SearchField`, `FilterChip`, `DeadlineBadge`, `StatusBadge`, `SourceLink`, `ViewTabs`, `EvidenceCard`, `Button`, `StatePanel`, and `ThemeToggle` are reusable patterns.
- Primitive showcase `/dev/primitives` exercises default, hover, focus, active, disabled, loading, error, long Korean, long URL, light/dark, and reduced-motion states at all three widths.

## 6. Motion & Interaction

| Token | Value | Use |
|---|---|---|
| `--duration-press` | `120ms` | Button/card press |
| `--duration-fast` | `160ms` | Color, border, focus |
| `--duration-standard` | `190ms` | Tabs, cards, view swap |
| `--duration-drawer` | `240ms` | Evidence overlay |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Enter and hover |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | State change |

Mechanisms:

- Search focus transitions border, shadow, and a maximum 1.005 scale using transform only.
- Interactive cards move `translateY(-2px)` on hover and `scale(.995)` on press.
- Tabs use a scoped active background/indicator and a 190ms content fade/4px translate.
- Drawer uses transform/opacity only; the scrim fades independently.
- `prefers-reduced-motion: reduce` removes spatial transforms and switches view/drawer state instantly or by opacity only.
- Motion always communicates focus, selection, opening, or press. No entrance cascade, parallax, or decorative looping.

## 7. Depth & Surface

The page uses one consistent light source and three restrained elevation levels.

| Level | Token | Treatment | Usage |
|---|---|---|---|
| Quiet | `--shadow-quiet` | `0 1px 2px` blue-gray at very low alpha | Navbar and static cards |
| Card | `--shadow-card` | contact plus broad blue-gray ambient layer | Search and hoverable cards |
| Floating | `--shadow-floating` | larger ambient plus semantic ring | Evidence drawer and overlays |

Rules:

- The hero search is the only strongly floating element above the fold.
- Conference cards use border plus quiet shadow; not every section is boxed.
- Timeline rows use whitespace and soft separators, not individual floating cards.
- Pale radial gradients appear only in the hero atmosphere and focus halo.
- No glass beyond the sticky navbar’s subtle background blur; no neon or heavy shadow.

## 8. Accessibility Constraints & Accepted Debt

### Inclusive personas

1. Korean graduate researcher: finds a relevant deadline on a 375px phone under time pressure. Pass if search, chips, D-Day, timezone, and official source are reachable with one hand and no page-level horizontal scroll.
2. lab manager: compares fields, timeline, calendar, evidence, and history at 1280px. Pass if view switching and selection preserve query/filter context.
3. low-vision keyboard researcher: uses 200% zoom, keyboard-only navigation, dark mode, and reduced motion. Pass if focus stays visible, reading order is logical, drawers do not trap incorrectly, and CJK never clips.

### Constraints

- WCAG 2.2 AA target; 4.5:1 body contrast, 3:1 large text/UI graphics, and a visible 2px+ `--focus-ring` treatment.
- Touch targets are at least 44px where space permits and never below 40px.
- Keyboard path covers skip link, navigation, search, filter chips, tabs, conference controls, source links, evidence close, and retry.
- `aria-pressed`, `aria-selected`, native dialog/button/link semantics, screen-reader labels, live search status, Escape close, focus trap/return, and safe external links remain.
- Status never depends on color; countdown, verified, review, and history states include visible text.
- Primary content reflows at 200% zoom. Only the labelled timeline viewport may scroll horizontally.
- Korean/CJK content must not strand particles/endings, clip descenders, show tofu, or split a compact semantic phrase because of avoidable width constraints.
- Theme and reduced motion are honored without removing information.

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
|---|---|---|---|
| None | None | No accepted debt | Closed |
