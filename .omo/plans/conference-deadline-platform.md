# Conference Deadline Platform MVP Plan

## TL;DR
> Summary:      Build a provenance-first Korean conference schedule browser whose public catalog is backed by immutable source evidence, deterministic fixtures, and one narrow, allowlisted crawl pipeline. The MVP deliberately favors explainable dates and reviewable change history over source breadth.
> Deliverables:
> - Bun workspace with Hono/Zod API, strict shared TypeScript domain/contracts, safe source adapters, and atomic JSON fixture storage
> - Source registry, immutable snapshots, observations, accepted versions, deterministic change detection, and operator review CLI
> - Vite/React list, calendar, and detail/evidence/history surfaces with Korean copy and responsive/accessibility gates
> - TDD unit/contract/integration/browser suites, bundled HTML/CFP/OpenReview fixtures, and CI-quality commands
> Effort:       Large
> Risk:         High - date normalization and source change handling can silently publish wrong deadlines unless provenance, ambiguity, and review gates are enforced end to end.

## Scope
### Must have
- A true greenfield Bun workspace rooted at `/local_data/conf_web`, initialized as a Git repository before task commits, with `apps/api`, `apps/web`, `packages/domain`, `packages/contracts`, `packages/crawler`, and `packages/storage` boundaries.
- Strict TypeScript (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`), Biome, Bun tests for non-DOM code, Vitest/Testing Library for React, and Playwright with real Chrome for browser coverage.
- Normalized, readonly, branded-ID domain records for `Edition`, `Track`, `Deadline`, `Source`, `Snapshot`, `Observation`, `ConferenceVersion`, and `ReviewTask`; external JSON and HTTP input is parsed by Zod before it enters the domain.
- Deadline normalization that stores a canonical RFC 3339 UTC instant while retaining the exact source text, source timezone label/offset, source locator, snapshot, and parser version. Explicit `23:59 AoE` is interpreted as `23:59:59-12:00`; an absent/implicit zone, “midnight,” missing year, range, rolling date, or parse conflict is never guessed and creates a review task.
- A compile-time/data-file source registry. Live fetching accepts a source ID only, never an arbitrary URL. The initial live-capable source is `cui-2026-official` at `https://cui.acm.org/2026/submission/`; deterministic reduced fixtures cover official HTML, CFP HTML, OpenReview JSON, malformed input, irrelevant markup changes, and changed deadlines.
- Crawler safety: HTTPS-only exact-host allowlists, DNS rejection of loopback/private/link-local targets, redirect revalidation, robots.txt handling, one in-flight request per host, at least 1 second between requests, bounded body size (2 MiB), accepted content types, 10-second timeout, explicit user agent, conditional requests, and no automatic retry storm.
- Provenance chain `Source -> Snapshot -> Observation -> ConferenceVersion`, preserving request/final URL, fetch/check time, status, ETag, Last-Modified, content type, SHA-256 bytes hash, robots decision, source locator, raw value, normalized value, confidence, and parser name/version. A 304 records a check that points to the prior content snapshot.
- Deterministic change behavior: byte-identical or semantically identical fetches do not create versions; the first complete high-confidence observation can publish; any change to a published deadline, conflicting observation, low confidence (`<0.90`), or ambiguity creates a pending review and leaves the current published version unchanged. Accepting a review creates a new immutable version; rejecting it closes the task without changing the published version.
- Public read-only API: `GET /api/v1/health`, `GET /api/v1/editions`, `GET /api/v1/editions/:editionId`, `GET /api/v1/editions/:editionId/evidence`, and `GET /api/v1/editions/:editionId/history`. Empty collections are `200` with `items: []`; malformed input is RFC-7807-style `400`; well-formed missing IDs are `404`.
- Local operator CLIs, not public mutation routes: `crawl` (fixture by default; live only with `--live` and a registered source ID), `review list`, and `review resolve --accept|--reject --note`. Runtime writes go to an explicit `--data-dir` (default `.local/runtime`, gitignored); checked-in `data/seed` and `fixtures` remain deterministic.
- Korean public experience: homepage search/filter with list/calendar view, edition detail with deadlines by track, evidence links, and change timeline. Required copy includes “학회 마감 일정”, “검색 결과가 없습니다”, “근거 보기”, “변경 이력”, and clear API/error recovery text.
- Personas embedded in `DESIGN.md` and `.omo/frontend-design/state.md`: (1) a Korean graduate researcher checking a deadline one-handed on a 375px phone under time pressure, (2) a lab manager comparing multiple tracks on desktop, and (3) a low-vision/keyboard/reduced-motion researcher at 200% zoom. Each public flow must name which persona it serves.
- Cal.com-inspired monochrome direction adapted for Korean: white/near-white canvas, charcoal text, semantic color only for focus/status/link meaning, ring-plus-soft elevation, dense metadata with breathable task flow, no copied brand assets or copy. Taste variance 5, motion 3, density 6.
- `DESIGN.md` before any product component, a dev-only primitive showcase before product screens, visible focus, semantic landmarks/tables/lists, 44px touch targets, contrast meeting WCAG 2.2 AA, reduced-motion behavior, screen-reader names, no horizontal primary-content scroll at 375px or 200% zoom.
- Browser proof at 375, 768, and 1280 px for list, calendar, detail, empty, malformed/error, evidence, and history states; full `typecheck`, `lint`, `test`, `build`, and production-preview checks.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- No universal scraper, heuristic web search, arbitrary URL input, browser-based scraping, authentication bypass, login automation, or scraping of sites outside the explicit registry.
- No claim of broad conference coverage. The MVP proves the adapter/pipeline with one live-capable official source and deterministic fixtures for the three source shapes.
- No PostgreSQL/SQLite/ORM, queue, scheduler, cron, cloud object storage, analytics, email/push notification, user account, favorites, ICS export, or calendar synchronization.
- No public ingest/review mutation endpoint and no invented deployment credential, hostname, secret, reverse-proxy, or cloud configuration.
- No overwrite of snapshot bytes, observation provenance, published version, or rejected review history; no publishing an ambiguous or changed deadline before review.
- No live-network dependency in unit, contract, integration, or CI tests. Live crawl is an opt-in smoke command only and must safely report a blocked/unavailable source without changing accepted catalog data.
- No raw HTML stored in API responses or rendered with `dangerouslySetInnerHTML`; evidence is escaped source text plus locator and source URL.
- No copied Cal.com logo, trademarked imagery, page composition, or remote font dependency. The Korean UI uses a system/Pretendard-compatible stack and project-owned tokens.
- No UI before `DESIGN.md` and the primitive showcase gate; no raw color values outside `DESIGN.md`/`tokens.css`, decorative-only motion, emoji icons, placeholder copy, or desktop-only calendar grid forced onto mobile.
- No source file above 250 non-blank/non-comment lines without a documented `SIZE_OK` exception; no `any`, non-null assertions, `@ts-ignore`, default exports except a framework-required entry, or unbounded catch-and-swallow.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD + `bun:test` for domain/crawler/storage/API, Vitest + Testing Library for React, and Playwright with `channel: "chrome"` for integration/accessibility/responsive scenarios. Every implementation task starts with the named RED test, records the failure, then implements GREEN and refactors under the full quality gate.
- QA policy: every task has agent-executed scenarios
- Evidence: `<attemptDir>/task-<N>-<slug>.<ext>` — under ulw-loop, `<attemptDir>` is the `currentAttemptDir` from `omo ulw-loop status --json` (`.omo/evidence/ulw/<session>/<goalId>/a<attempt>`); outside ulw-loop use `.omo/evidence/`

## Execution strategy
### Parallel execution waves
> Target 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks to maximize parallelism.

Preflight (orchestrator only, before parallel workers): `cd /local_data/conf_web && git init -b main`. Do not create a commit here; Task 1 owns the first commit. The four Wave-1 tasks touch disjoint paths and use only Bun built-ins until Task 1 finishes dependency installation.

Wave 1 (no dependencies):
- Task 1: scaffold Git-aware Bun workspace, package manifests, shared quality configuration, CI, and run documentation
- Task 2: implement pure domain identities, entities, invariants, AoE normalization, provenance projection, and semantic diff
- Task 3: establish design brief, personas, Cal-inspired token contract, and automated design-contract gate
- Task 4: create reduced deterministic source fixtures and seed catalog/state corpus

Wave 2 (after Wave 1):
- Task 5: depends [1, 2, 4] - implement repository ports and atomic JSON/in-memory storage
- Task 6: depends [1, 2] - implement allowlisted robots-aware safe fetch and immutable snapshot capture
- Task 7: depends [1, 2, 4] - implement official HTML, CFP, and OpenReview parsers plus normalization
- Task 8: depends [1, 2] - implement Zod API contracts and Hono app boundary against a repository fake
- Task 9: depends [1, 3] - implement tokens, dev tooling, primitives, and responsive primitive showcase

Wave 3 (after Wave 2):
- Task 10: depends [2, 4, 5, 6, 7] - implement ingestion, change/review policy, version publication, and operator CLIs
- Task 11: depends [5, 8] - wire public read-only API routes to the repository
- Task 12: depends [3, 8, 9] - implement searchable list/calendar homepage against the typed client
- Task 13: depends [3, 8, 9] - implement edition detail, evidence, and change-history surface

Critical path: Task 1 -> Task 6 -> Task 10 -> Final verification

### Dependency matrix
| Task | Depends on | Blocks | Can parallelize with |
|------|------------|--------|----------------------|
| 1 | none | 5, 6, 7, 8, 9 | 2, 3, 4 |
| 2 | none | 5, 6, 7, 8, 10 | 1, 3, 4 |
| 3 | none | 9, 12, 13 | 1, 2, 4 |
| 4 | none | 5, 7, 10 | 1, 2, 3 |
| 5 | 1, 2, 4 | 10, 11 | 6, 7, 8, 9 |
| 6 | 1, 2 | 10 | 5, 7, 8, 9 |
| 7 | 1, 2, 4 | 10 | 5, 6, 8, 9 |
| 8 | 1, 2 | 11, 12, 13 | 5, 6, 7, 9 |
| 9 | 1, 3 | 12, 13 | 5, 6, 7, 8 |
| 10 | 2, 4, 5, 6, 7 | final verification | 11, 12, 13 |
| 11 | 5, 8 | final verification | 10, 12, 13 |
| 12 | 3, 8, 9 | final verification | 10, 11, 13 |
| 13 | 3, 8, 9 | final verification | 10, 11, 12 |

## Todos
> Implementation + Test = ONE task. Never separate.
> Every task MUST have: References + Acceptance Criteria + QA Scenarios + Commit.

- [ ] 1. Scaffold the Bun workspace and executable quality gates

  What to do: Initialize the workspace contract in `package.json` (`private`, `packageManager: "bun@1.3.14"`, `workspaces: ["apps/*", "packages/*"]`) and create `bunfig.toml`, `tsconfig.base.json`, `biome.json`, `.gitignore`, `README.md`, `.github/workflows/ci.yml`, all six workspace `package.json` files, and minimal per-workspace `tsconfig.json` files. Pin resolved dependency versions through `bun.lock`: Hono and Zod for API/contracts; `ky`, `cheerio`, `robots-parser`, and its types for crawler; React, React DOM, React Router, Vite for web; Biome, TypeScript, Bun types, Vitest, Testing Library, jsdom, Playwright, react-grab, and react-scan as development dependencies. Root scripts must include `dev`, `typecheck`, `lint`, `test`, `build`, `doctor`, and `e2e`, using Bun workspace filters and `--if-present` so the scaffold is valid before later source exists. Configure Vite `/api` proxy for both dev and preview, Playwright with `channel: "chrome"`, and CI as install -> typecheck -> lint -> test -> build -> e2e with no deployment. RED: add `scripts/workspace-contract.test.ts` first, proving the missing workspace/scripts/strict flags fail. GREEN: create the configs, run `bun install`, and make the contract test and root smoke scripts pass. README must document local commands, the public/read-only versus operator/write boundary, `data/seed` versus `.local/runtime`, and the opt-in nature of live crawling.
  Must NOT do: Do not generate product source, add a database, add deployment/cloud files, use npm/pnpm/yarn, place production dependencies at the workspace root, or run a live crawl.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [5, 6, 7, 8, 9] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `scripts/workspace-contract.test.ts` - greenfield contract test created RED-first in this task
  - API/Type: `tsconfig.base.json:compilerOptions` - strict flags inherited by every workspace
  - Test:     `package.json:scripts` - root executable gate definitions
  - External: `https://bun.com/docs/pm/workspaces` - Bun workspace and filter semantics
  - External: `https://bun.com/docs/test` - Bun test discovery and CLI
  - External: `https://vite.dev/guide/` - Vite React/TypeScript build contract

  Acceptance criteria (agent-executable only):
  - [ ] `bun test scripts/workspace-contract.test.ts` exits 0 and asserts all six workspace manifests, the seven root scripts, Bun `1.3.14`, and strict TypeScript flags.
  - [ ] `bun install --frozen-lockfile && bun run typecheck && bun run lint && bun run test && bun run build` exits 0 on the scaffold.
  - [ ] `git status --short` contains no ignored `.local`, `dist`, `coverage`, Playwright report, React Doctor report, or environment-secret artifact.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: in Codex, use `browser:control-in-app-browser` first when available and no authenticated/persistent user browser profile is required; otherwise use Chrome to drive the page, or agent-browser (https://github.com/vercel-labs/agent-browser) when Chrome is unavailable. Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: Fresh deterministic installation
    Tool:     bash
    Steps:    Run `cd /local_data/conf_web && rm -rf node_modules && bun install --frozen-lockfile && bun run typecheck && bun run test` in a disposable implementation worktree, then save stdout/stderr.
    Expected: Install uses `bun.lock`; typecheck and tests exit 0 without network-dependent tests.
    Evidence: <attemptDir>/task-1-workspace.txt   (attemptDir = currentAttemptDir from `omo ulw-loop status --json`, .omo/evidence/ulw/<session>/<goalId>/a<attempt>)

  Scenario: Missing strict flag is rejected
    Tool:     bash
    Steps:    In a disposable copy, set `noUncheckedIndexedAccess` to false in `tsconfig.base.json`, run `bun test scripts/workspace-contract.test.ts`, and restore the copy.
    Expected: Test exits non-zero with an assertion naming `noUncheckedIndexedAccess`.
    Evidence: <attemptDir>/task-1-workspace-error.txt
  ```

  Commit: YES | Message: `chore(workspace): scaffold strict Bun monorepo` | Files: [`package.json`, `bun.lock`, `bunfig.toml`, `tsconfig.base.json`, `biome.json`, `.gitignore`, `README.md`, `.github/workflows/ci.yml`, `apps/*/package.json`, `apps/*/tsconfig.json`, `packages/*/package.json`, `packages/*/tsconfig.json`, `scripts/workspace-contract.test.ts`]

- [ ] 2. Encode the normalized domain, AoE policy, provenance, and semantic diff

  What to do: Create `packages/domain/src/ids.ts`, `constants.ts`, `entities.ts`, `aggregate.ts`, `deadline-time.ts`, `invariants.ts`, `provenance.ts`, `diff.ts`, `errors.ts`, and `index.ts`, each under 250 pure LOC. Use branded IDs and readonly properties. Define discriminated unions rather than enums. Exact records: `Edition{id,seriesSlug,acronym,year,name,startDate?,endDate?,status,currentVersionId?}`, `Track{id,editionId,slug,name,parentTrackId?}`, `Deadline{id,editionId,trackId?,kind,label,dueAtUtc,sourceDateText,sourceTimezone,sourceObservationId,status}`, `Source{id,editionId,kind,canonicalUrl,adapterKey,allowedHosts}`, `Snapshot{id,sourceId,kind,requestedUrl,finalUrl,checkedAt,httpStatus,etag?,lastModified?,contentType?,sha256?,bodyRef?,robotsDecision,notModifiedFromSnapshotId?}`, `Observation{id,snapshotId,entityKey,fieldPath,rawValue,normalizedValue?,confidence,locator,parserName,parserVersion,state}`, `ConferenceVersion{id,editionId,number,createdAt,contentHash,acceptedObservationIds,aggregate,changes}`, and `ReviewTask{id,editionId,observationId?,fieldPath,reason,state,createdAt,resolvedAt?,resolutionNote?}`. RED: tests first for branded identity separation, edition/track/deadline referential invariants, invalid confidence, explicit AoE conversion, ambiguous time result, canonical stable hashing, and semantic diff. GREEN: implement pure constructors/results. Define explicit `23:59 AoE` as `23:59:59-12:00` and canonical UTC as the next day `11:59:59Z`; never infer AoE from a date-only value. Sort aggregate collections by canonical ID before hashing. Diff accepted versions only and represent before/after observation IDs, not only text.
  Must NOT do: Do not import Hono, React, storage, crawler, Zod, filesystem, system time, or random UUIDs; do not model UI/API DTOs here; do not use mutable exported records or raw strings for IDs.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [5, 6, 7, 8, 10] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/domain/src/entities.ts:ConferenceVersion` - immutable normalized model and accepted aggregate
  - API/Type: `packages/domain/src/deadline-time.ts:parseSourceDeadline` - typed `normalized | review-needed` result
  - Test:     `packages/domain/src/deadline-time.test.ts` - AoE and ambiguity matrix
  - External: `https://datatracker.ietf.org/doc/html/rfc3339#section-5.6` - canonical offset-bearing timestamps
  - External: `https://cui.acm.org/2026/submission/` - official page explicitly using AoE
  - External: `https://www.w3.org/TR/prov-dm/` - provenance entity/activity/derivation model

  Acceptance criteria (agent-executable only):
  - [ ] `bun test packages/domain` exits 0 with explicit assertions that `2026-03-16 23:59 AoE` normalizes to `2026-03-17T11:59:59Z`, while `2026-03-16`, `midnight`, and a missing year return `review-needed` without a fabricated `dueAtUtc`.
  - [ ] `bun test packages/domain/src/diff.test.ts` proves reordered equivalent aggregates hash identically, identical accepted versions produce zero changes, and one deadline change contains old/new observation IDs.
  - [ ] `bun run typecheck` rejects assigning `SourceId` to `EditionId`, and the checked-in code contains no `enum`, `any`, non-null assertion, or `@ts-` escape.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: in Codex, use `browser:control-in-app-browser` first when available and no authenticated/persistent user browser profile is required; otherwise use Chrome to drive the page, or agent-browser (https://github.com/vercel-labs/agent-browser) when Chrome is unavailable. Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: Explicit AoE becomes an exact UTC instant
    Tool:     bash
    Steps:    Run `bun test packages/domain/src/deadline-time.test.ts --test-name-pattern "explicit AoE"`.
    Expected: Test exits 0 and asserts raw text and `-12:00` provenance remain alongside `2026-03-17T11:59:59Z`.
    Evidence: <attemptDir>/task-2-domain-aoe.txt   (attemptDir = currentAttemptDir from `omo ulw-loop status --json`, .omo/evidence/ulw/<session>/<goalId>/a<attempt>)

  Scenario: Ambiguous date cannot enter a published version
    Tool:     bash
    Steps:    Run `bun test packages/domain/src/invariants.test.ts --test-name-pattern "ambiguous deadline"`.
    Expected: Test exits 0 because the constructor returns `review-needed`; no deadline aggregate is produced.
    Evidence: <attemptDir>/task-2-domain-ambiguity.txt
  ```

  Commit: YES | Message: `feat(domain): model provenanced conference deadlines` | Files: [`packages/domain/src/*.ts`]

- [ ] 3. Establish the design-system, personas, and design-contract gate

  What to do: Before any React component, create root `DESIGN.md`, `.omo/frontend-design/state.md`, `scripts/verify-design-contract.ts`, and RED-first `scripts/verify-design-contract.test.ts`. Treat the user-named Cal.com direction as the visual reference: review the current public page plus the packaged Cal reference, extract mechanisms rather than assets, and record the inspected URLs/screens and decisions in `DESIGN.md` Section 0. Explicitly record that Imagen concept generation is skipped because the named live reference and product direction are already concrete. Fill all mandatory sections: atmosphere/signature, semantic color tokens, Korean-capable type stack, 4px spacing scale, 1200px content width, 375/768/1280 behavior, primitive anatomy/states, motion (120ms micro, 180ms standard, transform/opacity only), ring-plus-soft depth, WCAG 2.2 AA constraints, personas, and accepted debt (initially none). Set the product signature as an evidence rail: each deadline can visually reveal its official-source lineage and version changes without leaving the task context. Define semantic colors precisely in the contract: canvas `#FFFFFF`, surface `#F7F7F7`, ink `#242424`, secondary `#686868`, border/ring `#E5E5E5`, link/focus `#005FCC`, success `#237A3B`, warning `#8A5A00`, danger `#B42318`; these are the only raw colors later copied into `tokens.css`. Use `Pretendard Variable, Pretendard, "Noto Sans KR", system-ui, sans-serif` and a system mono stack, with no network font. RED: the verifier fails for missing sections/personas/tokens/states. GREEN: complete the files until it passes.
  Must NOT do: Do not write JSX/CSS/product components, copy Cal.com assets/copy, introduce a second design document, use remote fonts, or leave accessibility/persona decisions to later workers.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [9, 12, 13] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `/home/jhso/.codex/plugins/cache/sisyphuslabs/omo/4.19.4/skills/frontend/references/design/design-system-architecture.md:DESIGN.md Structure` - mandatory design contract sections
  - API/Type: `DESIGN.md:Section 5 Components` - primitive states and accessibility contract consumed by Task 9
  - Test:     `scripts/verify-design-contract.test.ts` - structural and token gate
  - External: `https://cal.com/` - named visual reference; extract grayscale scheduling grammar only
  - External: `https://www.w3.org/WAI/WCAG22/quickref/` - WCAG 2.2 AA checks

  Acceptance criteria (agent-executable only):
  - [ ] `bun test scripts/verify-design-contract.test.ts` exits 0 and asserts Sections 0-8, all three personas, the exact taste/motion/density values, required states, breakpoints, semantic tokens, reduced motion, 200% zoom, and an empty accepted-debt table.
  - [ ] `bun scripts/verify-design-contract.ts` exits 0 and reports no product UI file exists yet outside the allowed design-state/verifier paths.
  - [ ] `rg -n "Cal.com|cal.com" DESIGN.md .omo/frontend-design/state.md` shows attribution/research only and no copied logo or brand copy instruction.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: in Codex, use `browser:control-in-app-browser` first when available and no authenticated/persistent user browser profile is required; otherwise use Chrome to drive the page, or agent-browser (https://github.com/vercel-labs/agent-browser) when Chrome is unavailable. Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: Design contract is complete and traceable
    Tool:     bash
    Steps:    Run `bun test scripts/verify-design-contract.test.ts && bun scripts/verify-design-contract.ts` and save output.
    Expected: Both commands exit 0; output names three personas, nine sections, responsive widths, and zero accepted debt.
    Evidence: <attemptDir>/task-3-design-contract.txt   (attemptDir = currentAttemptDir from `omo ulw-loop status --json`, .omo/evidence/ulw/<session>/<goalId>/a<attempt>)

  Scenario: Missing focus token blocks UI work
    Tool:     bash
    Steps:    In a disposable copy remove `--focus-ring` from `DESIGN.md`, run `bun test scripts/verify-design-contract.test.ts`, and discard the copy.
    Expected: Test exits non-zero naming the missing focus token.
    Evidence: <attemptDir>/task-3-design-contract-error.txt
  ```

  Commit: YES | Message: `docs(design): define conference schedule experience` | Files: [`DESIGN.md`, `.omo/frontend-design/state.md`, `scripts/verify-design-contract.ts`, `scripts/verify-design-contract.test.ts`]

- [ ] 4. Build deterministic reduced fixtures and seed state

  What to do: Create `fixtures/manifest.json`, `fixtures/raw/cui-2026-official.html`, `fixtures/raw/cfp-call.html`, `fixtures/raw/openreview-venue.json`, `fixtures/raw/malformed.html`, `fixtures/raw/cui-2026-irrelevant-change.html`, `fixtures/raw/cui-2026-deadline-change.html`, matching `fixtures/expected/*.json`, `data/seed/catalog-state.json`, `data/seed/bodies/<sha256>.bin`, and RED-first `fixtures/fixtures.test.ts`. Fixtures must be minimal, original/reduced excerpts containing only structures and factual deadline strings needed for tests; manifest records source kind, canonical URL, capture date, license/provenance note, expected SHA-256, parser version, and whether live access is permitted. Seed state must contain at least two editions, three tracks, five deadlines, one accepted version with evidence, one previous version/change, and one pending review so list/calendar/detail/history/review states are demonstrable. Use fixed RFC3339 timestamps and stable IDs. The official CUI fixture includes an explicit `23:59 AoE`; CFP includes a missing timezone; OpenReview includes explicit millisecond epoch/UTC data; malformed fixture contains no usable deadline. RED: manifest/hash/foreign-key tests fail before files. GREEN: create the corpus and exact expectations.
  Must NOT do: Do not vendor complete copyrighted pages, fetch live content during tests, embed scripts/trackers, use wall-clock timestamps/random IDs, or put mutable runtime output under `data/seed`.

  Parallelization: Can parallel: YES | Wave 1 | Blocks: [5, 7, 10] | Blocked by: []

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `fixtures/manifest.json` - source-to-fixture provenance and hash registry
  - API/Type: `data/seed/catalog-state.json` - normalized seed arrays keyed by branded-ID string representation
  - Test:     `fixtures/fixtures.test.ts` - hashes, fixed times, foreign keys, and corpus state coverage
  - External: `https://cui.acm.org/2026/submission/` - canonical factual AoE source URL
  - External: `https://docs.openreview.net/reference/api-v2` - OpenReview JSON field semantics

  Acceptance criteria (agent-executable only):
  - [ ] `bun test fixtures/fixtures.test.ts` exits 0 and validates every manifest SHA-256, no remote request, no `<script>`, all foreign keys, and required scenario coverage.
  - [ ] Running `sha256sum fixtures/raw/* data/seed/bodies/*` twice produces byte-identical output and every timestamp in seed/expected JSON ends with `Z` or an explicit offset.
  - [ ] `du -sk fixtures data/seed` is below 512 KiB, proving fixtures are reduced rather than full-page mirrors.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: in Codex, use `browser:control-in-app-browser` first when available and no authenticated/persistent user browser profile is required; otherwise use Chrome to drive the page, or agent-browser (https://github.com/vercel-labs/agent-browser) when Chrome is unavailable. Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: Fixture corpus provides all MVP source shapes
    Tool:     bash
    Steps:    Run `bun test fixtures/fixtures.test.ts --test-name-pattern "source shape coverage"`.
    Expected: Test exits 0 and reports official-html, cfp, openreview, malformed, irrelevant-change, and deadline-change fixtures.
    Evidence: <attemptDir>/task-4-fixtures.txt   (attemptDir = currentAttemptDir from `omo ulw-loop status --json`, .omo/evidence/ulw/<session>/<goalId>/a<attempt>)

  Scenario: Tampered fixture hash is rejected
    Tool:     bash
    Steps:    In a disposable copy append one byte to `fixtures/raw/cfp-call.html` and run `bun test fixtures/fixtures.test.ts`.
    Expected: Test exits non-zero and names `cfp-call.html` SHA-256 mismatch.
    Evidence: <attemptDir>/task-4-fixtures-error.txt
  ```

  Commit: YES | Message: `test(fixtures): add deterministic source corpus` | Files: [`fixtures/**`, `data/seed/**`]

- [ ] 5. Implement repository ports and atomic JSON storage

  What to do: Create `packages/storage/src/catalog-repository.ts`, `state-schema.ts`, `memory-repository.ts`, `json-file-repository.ts`, `atomic-write.ts`, `errors.ts`, `index.ts`, and colocated RED-first tests. The interface must expose typed reads (`listEditions`, `getEdition`, `getEvidence`, `getHistory`, `listReviewTasks`) and atomic write transaction operations (`recordSnapshot`, `recordObservations`, `publishVersion`, `createReviewTasks`, `resolveReviewTask`). Parse `catalog-state.json` with Zod at load, clone/freeze returned values, and enforce domain invariants and referential integrity before atomic temp-file + rename. Store raw body bytes content-addressed by SHA-256; never overwrite an existing hash. Inject `Clock` and `IdFactory`; tests use fixed implementations. JSON output must stable-sort arrays/keys so the same transaction is byte-identical. The memory repository mirrors semantics for API/unit tests. RED: invalid seed, partial write, duplicate snapshot, missing observation, and review transition tests. GREEN: implement with typed storage errors and no process-global data directory.
  Must NOT do: Do not add a database/ORM, mutate `data/seed`, accept caller-supplied raw JSON past the Zod boundary, expose filesystem paths in public DTOs, or use random/system time inside repository methods.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [10, 11] | Blocked by: [1, 2, 4]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/domain/src/entities.ts:ConferenceVersion` - immutable values the repository persists
  - API/Type: `packages/storage/src/catalog-repository.ts:CatalogRepository` - sole storage port used by API/crawler
  - Test:     `packages/storage/src/json-file-repository.test.ts` - temporary-directory atomicity/determinism pattern
  - External: `https://zod.dev/?id=defining-schemas` - parse untrusted JSON at the boundary

  Acceptance criteria (agent-executable only):
  - [ ] `bun test packages/storage` exits 0, including byte-identical two-run output with fixed clock/IDs and no modification to `data/seed`.
  - [ ] A forced write failure leaves the original `catalog-state.json` byte-identical and no temp file remains; test asserts this in an OS temp directory.
  - [ ] `bun run typecheck` proves API/crawler consumers depend on `CatalogRepository`, not `JsonFileRepository`.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: in Codex, use `browser:control-in-app-browser` first when available and no authenticated/persistent user browser profile is required; otherwise use Chrome to drive the page, or agent-browser (https://github.com/vercel-labs/agent-browser) when Chrome is unavailable. Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: Seed catalog loads through the typed repository
    Tool:     bash
    Steps:    Run `bun test packages/storage/src/json-file-repository.test.ts --test-name-pattern "loads seed"`.
    Expected: Test exits 0 and asserts two editions, evidence, history, and a pending review are returned as frozen typed values.
    Evidence: <attemptDir>/task-5-storage.txt   (attemptDir = currentAttemptDir from `omo ulw-loop status --json`, .omo/evidence/ulw/<session>/<goalId>/a<attempt>)

  Scenario: Corrupt foreign key is rejected without partial state
    Tool:     bash
    Steps:    Run `bun test packages/storage/src/json-file-repository.test.ts --test-name-pattern "foreign key"`.
    Expected: Test exits 0 because load returns typed `InvalidCatalogState` naming the missing source/snapshot relation.
    Evidence: <attemptDir>/task-5-storage-error.txt
  ```

  Commit: YES | Message: `feat(storage): persist immutable catalog state` | Files: [`packages/storage/src/*.ts`]

- [ ] 6. Implement the allowlisted, robots-aware fetch and snapshot boundary

  What to do: Create `packages/crawler/src/source-registry.ts`, `types.ts`, `url-policy.ts`, `network-policy.ts`, `robots-policy.ts`, `safe-http-client.ts`, `snapshot-capture.ts`, `errors.ts`, and RED-first tests with injected HTTP transport, DNS resolver, clock, and sleeper. Register `cui-2026-official` with exact URL/host, `kind: official-html`, and parser key. `SafeHttpClient.fetchRegistered(sourceId, priorValidators?)` must: resolve only a registry ID; require HTTPS; reject credentials/non-default ports/fragments; resolve and reject loopback/private/link-local IPs; obtain scheme/authority `/robots.txt`; follow at most five redirects while rechecking host and IP; treat robots 5xx/network failure as disallow, respect successful rules, cap cache at 24h; set descriptive user agent and `If-None-Match`/`If-Modified-Since`; use one per-host in-flight request and >=1000ms spacing; set ky timeout 10 seconds, retry 0, redirect manual; allow HTML/JSON/plain only; read at most 2 MiB; and return a typed fetch outcome. Snapshot capture hashes exact bytes, writes content-addressed body through the repository port, and makes a 304 check point at the prior snapshot. RED: arbitrary URL, redirect to localhost, robots disallow/unavailable, oversized body, wrong content type, 304, and successful response tests. GREEN: implement without real networking in tests.
  Must NOT do: Do not export a generic `fetch(url)`, accept runtime host allowlists, follow browser redirects automatically, retry 429/5xx, parse content here, log body bytes, or treat robots as authorization.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [10] | Blocked by: [1, 2]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/crawler/src/source-registry.ts:SOURCE_REGISTRY` - only live-fetch entry points
  - API/Type: `packages/crawler/src/safe-http-client.ts:SafeHttpClient` - injected transport and policy boundary
  - Test:     `packages/crawler/src/safe-http-client.test.ts` - no-network redirect/robots/body-limit matrix
  - External: `https://www.rfc-editor.org/rfc/rfc9309.html#section-2.3` - robots retrieval and failure handling
  - External: `https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.3` - conditional request validators
  - External: `https://www.rfc-editor.org/rfc/rfc9530.html` - content digest context

  Acceptance criteria (agent-executable only):
  - [ ] `bun test packages/crawler/src/safe-http-client.test.ts packages/crawler/src/snapshot-capture.test.ts` exits 0 with zero outbound sockets and all safety branches asserted.
  - [ ] `rg -n "fetch\(|ky\(" packages/crawler/src` finds network calls only inside `safe-http-client.ts`/the injected transport adapter; registry callers pass a `SourceId`, not a URL.
  - [ ] A 304 test records a new check timestamp and `notModifiedFromSnapshotId` without duplicating body bytes or creating parser output.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: in Codex, use `browser:control-in-app-browser` first when available and no authenticated/persistent user browser profile is required; otherwise use Chrome to drive the page, or agent-browser (https://github.com/vercel-labs/agent-browser) when Chrome is unavailable. Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: Registered source yields immutable snapshot metadata
    Tool:     bash
    Steps:    Run `bun test packages/crawler/src/snapshot-capture.test.ts --test-name-pattern "registered source"`.
    Expected: Test exits 0 and asserts final URL, ETag, Last-Modified, SHA-256, bodyRef, robots allow, fixed check time, and parser-neutral outcome.
    Evidence: <attemptDir>/task-6-fetch.txt   (attemptDir = currentAttemptDir from `omo ulw-loop status --json`, .omo/evidence/ulw/<session>/<goalId>/a<attempt>)

  Scenario: Redirect toward private address is blocked
    Tool:     bash
    Steps:    Run `bun test packages/crawler/src/safe-http-client.test.ts --test-name-pattern "private redirect"`.
    Expected: Test exits 0 because outcome is `blocked` with code `PRIVATE_ADDRESS`; no second HTTP request occurs.
    Evidence: <attemptDir>/task-6-fetch-error.txt
  ```

  Commit: YES | Message: `feat(crawler): enforce safe source fetching` | Files: [`packages/crawler/src/source-registry.ts`, `packages/crawler/src/types.ts`, `packages/crawler/src/url-policy.ts`, `packages/crawler/src/network-policy.ts`, `packages/crawler/src/robots-policy.ts`, `packages/crawler/src/safe-http-client.ts`, `packages/crawler/src/snapshot-capture.ts`, `packages/crawler/src/errors.ts`, `packages/crawler/src/*.test.ts`]

- [ ] 7. Implement narrow source parsers and confidence-bearing normalization

  What to do: Create `packages/crawler/src/parsers/parser.ts`, `official-html.ts`, `cfp-html.ts`, `openreview.ts`, `parser-registry.ts`, `normalize.ts`, `source-locator.ts`, and RED-first fixture tests. Parsers are source-shape adapters, not universal heuristics: official/CFP HTML uses configured selectors/labels from the registered adapter; OpenReview parses a Zod-defined JSON projection. Output is a `ParseResult` containing observations and typed issues; it never returns domain deadlines directly. Each observation includes source locator (CSS selector + row/label or JSON Pointer), raw text/value, normalized candidate, confidence, and parser name/version. Confidence policy: explicit configured field + explicit timezone >=0.90; missing zone/year, midnight/range/rolling, conflicting values, missing required node, or malformed JSON becomes `needs-review` and cannot contain a fabricated deadline. Preserve unknown fields only as parser issues, not untyped payload. RED: all fixtures, AoE, OpenReview epoch, missing zone, malformed content, and changed/irrelevant content tests. GREEN: implement dispatch and normalization using Task 2 constructors.
  Must NOT do: Do not search the open web, guess selectors across sites, infer timezone/year, silently drop parse errors, use regex as the sole HTML parser, or pass DOM/unknown JSON beyond the adapter boundary.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [10] | Blocked by: [1, 2, 4]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `fixtures/manifest.json` - parser key/source kind and expected result mapping
  - API/Type: `packages/crawler/src/parsers/parser.ts:ParseResult` - exhaustive observation/issues boundary
  - Test:     `packages/crawler/src/parsers/parsers.fixture.test.ts` - table over every deterministic source shape
  - External: `https://docs.openreview.net/reference/api-v2` - OpenReview API representation
  - External: `https://cui.acm.org/2026/submission/` - explicit AoE semantics in official content

  Acceptance criteria (agent-executable only):
  - [ ] `bun test packages/crawler/src/parsers packages/crawler/src/normalize.test.ts` exits 0 and matches every `fixtures/expected/*.json` file exactly.
  - [ ] The CUI observation retains raw `23:59 AoE`, exact CSS/row locator, confidence >=0.90, parser version, and UTC instant; CFP missing-zone observation is `needs-review` with no `dueAtUtc`.
  - [ ] `rg -n "dangerouslySetInnerHTML|eval\(|new Function|document\.write" packages/crawler` returns no matches.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: in Codex, use `browser:control-in-app-browser` first when available and no authenticated/persistent user browser profile is required; otherwise use Chrome to drive the page, or agent-browser (https://github.com/vercel-labs/agent-browser) when Chrome is unavailable. Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: Three source shapes normalize deterministically
    Tool:     bash
    Steps:    Run `bun test packages/crawler/src/parsers/parsers.fixture.test.ts --test-name-pattern "supported fixtures"`.
    Expected: Test exits 0 and exact outputs match official HTML, CFP HTML, and OpenReview JSON expectations.
    Evidence: <attemptDir>/task-7-parsers.txt   (attemptDir = currentAttemptDir from `omo ulw-loop status --json`, .omo/evidence/ulw/<session>/<goalId>/a<attempt>)

  Scenario: Malformed and ambiguous input is reviewable, not invented
    Tool:     bash
    Steps:    Run `bun test packages/crawler/src/parsers/parsers.fixture.test.ts --test-name-pattern "malformed or ambiguous"`.
    Expected: Test exits 0; outputs contain typed issues/needs-review observations and zero fabricated deadline aggregates.
    Evidence: <attemptDir>/task-7-parsers-error.txt
  ```

  Commit: YES | Message: `feat(crawler): parse registered deadline sources` | Files: [`packages/crawler/src/parsers/*.ts`, `packages/crawler/src/normalize.ts`, `packages/crawler/src/source-locator.ts`]

- [ ] 8. Define the typed public API and Hono boundary

  What to do: Create `packages/contracts/src/common.ts`, `edition.ts`, `evidence.ts`, `history.ts`, `problem.ts`, `index.ts`; and `apps/api/src/app.ts`, `context.ts`, `errors.ts`, `routes/health.ts`, `routes/editions.ts`, plus RED-first contract tests using a fake `CatalogRepository`. Zod schemas are the single source for requests/responses and infer exported readonly DTOs. Exact list query: `query` trimmed max 100 chars, optional `year` integer 2000-2100, optional `track`, `limit` default 50 max 100, `cursor` opaque optional. Exact envelope: `{items, page:{nextCursor:null|string}, meta:{total,generatedAt}}`. Detail includes current version and deadline evidence summaries; full evidence/history use their own routes. Problem body: `{type,title,status,detail,instance,issues?}` with `application/problem+json`. Define `createApp({repository,clock})` for tests and a separate `server.ts` runtime entry later. RED: 200 empty, 400 invalid year/limit/cursor, 404 well-formed missing ID, stable response schema, and no repository detail leakage. GREEN: implement validation and handler mapping.
  Must NOT do: Do not add write routes, expose review tasks/raw body paths, duplicate hand-written DTO types, throw Zod errors to clients, or bind a network port in tests.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [11, 12, 13] | Blocked by: [1, 2]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/domain/src/entities.ts` - internal model mapped to public DTOs
  - API/Type: `packages/contracts/src/problem.ts:ProblemSchema` - all API failures
  - Test:     `apps/api/src/app.contract.test.ts` - direct `app.request` contract pattern
  - External: `https://hono.dev/docs/getting-started/bun` - Hono app/Bun boundary
  - External: `https://hono.dev/docs/guides/validation` - Zod request validation
  - External: `https://www.rfc-editor.org/rfc/rfc9457.html` - problem detail response format

  Acceptance criteria (agent-executable only):
  - [ ] `bun test packages/contracts apps/api/src/app.contract.test.ts` exits 0 for empty, populated, malformed, and missing-resource cases.
  - [ ] `GET /api/v1/editions` against the fake returns status 200, `items: []`, `total: 0`; `year=abc` returns status 400 and content type `application/problem+json`.
  - [ ] `bun run typecheck` proves every public handler response satisfies a contracts package Zod-inferred DTO.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: in Codex, use `browser:control-in-app-browser` first when available and no authenticated/persistent user browser profile is required; otherwise use Chrome to drive the page, or agent-browser (https://github.com/vercel-labs/agent-browser) when Chrome is unavailable. Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: Empty catalog is a successful typed response
    Tool:     bash
    Steps:    Run `bun test apps/api/src/app.contract.test.ts --test-name-pattern "empty catalog"`.
    Expected: Test exits 0; response is 200 with `items: []`, null cursor, total 0, and fixed generatedAt.
    Evidence: <attemptDir>/task-8-api-contract.txt   (attemptDir = currentAttemptDir from `omo ulw-loop status --json`, .omo/evidence/ulw/<session>/<goalId>/a<attempt>)

  Scenario: Malformed query returns stable problem JSON
    Tool:     bash
    Steps:    Run `bun test apps/api/src/app.contract.test.ts --test-name-pattern "malformed query"`.
    Expected: Test exits 0; response is 400 `application/problem+json`, issues identify `year`, and no stack trace is present.
    Evidence: <attemptDir>/task-8-api-contract-error.txt
  ```

  Commit: YES | Message: `feat(api): define public catalog contracts` | Files: [`packages/contracts/src/*.ts`, `apps/api/src/app.ts`, `apps/api/src/context.ts`, `apps/api/src/errors.ts`, `apps/api/src/routes/*.ts`, `apps/api/src/*.test.ts`]

- [ ] 9. Pass the design-system and primitive showcase gates

  What to do: Create `apps/web/src/styles/tokens.css`, `global.css`, `main.tsx`, `router.tsx`, `dev/PrimitiveShowcase.tsx`, and reusable `components/ui/{Button,TextInput,Select,Tabs,Badge,Surface,StatePanel,Skeleton,EvidenceLink}.tsx` with colocated CSS modules/tests. Copy only the Task 3 semantic tokens into `tokens.css`; all components consume variables. Wire `react-grab` and `react-scan` behind `import.meta.env.DEV && VITE_DISABLE_REACT_DEVTOOLS !== "1"`; add `doctor` script for React Doctor; exclude `/__showcase` and runtime tools from production. The showcase must exercise default, hover, active, focus, disabled, loading, empty, and error states at 375/768/1280, Korean long labels, unbroken strings, keyboard traversal, and reduced motion. Use CSS/WAAPI micro transitions only; no motion library. RED: component tests and a production-bundle leak test fail first. GREEN: implement primitives, showcase, dev gates, and design-token compliance.
  Must NOT do: Do not create product pages, use raw hex/spacing values outside token files, import an icon library by default, animate layout properties, ship showcase/dev tools in production, or use placeholder/English-only labels.

  Parallelization: Can parallel: YES | Wave 2 | Blocks: [12, 13] | Blocked by: [1, 3]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `DESIGN.md:Sections 2-7` - sole token/component/motion/depth contract
  - API/Type: `apps/web/src/components/ui/StatePanel.tsx:StatePanelProps` - shared loading/empty/error state anatomy
  - Test:     `apps/web/src/dev/PrimitiveShowcase.test.tsx` - state/content-stress gate
  - External: `https://cal.com/` - monochrome scheduling grammar, not assets
  - External: `https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html` - touch target requirement

  Acceptance criteria (agent-executable only):
  - [ ] `bun run --filter @conf/web test && bun run --filter @conf/web build && bun run doctor` exits 0 with no accessibility/performance-category finding.
  - [ ] `rg -n "#[0-9A-Fa-f]{3,8}|rgb\(|hsl\(" apps/web/src --glob '!styles/tokens.css'` returns no matches, and production `dist` contains no `react-grab`, `react-scan`, or `__showcase` string.
  - [ ] Playwright showcase tests at 375/768/1280 and `reducedMotion: "reduce"` pass with no horizontal primary-content overflow and a visible focus indicator on each control.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: in Codex, use `browser:control-in-app-browser` first when available and no authenticated/persistent user browser profile is required; otherwise use Chrome to drive the page, or agent-browser (https://github.com/vercel-labs/agent-browser) when Chrome is unavailable. Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: Primitive states survive all target widths
    Tool:     playwright(real Chrome)
    Steps:    Run `bunx playwright test apps/web/e2e/primitive-showcase.spec.ts --project=chrome` after `bun run --filter @conf/web dev`; the spec visits `/__showcase`, drives tab/hover/press, and captures 375, 768, 1280 screenshots.
    Expected: All states are visible/labelled, focus order is logical, Korean long text wraps, and `scrollWidth === clientWidth` for primary content.
    Evidence: <attemptDir>/task-9-primitives.png   (attemptDir = currentAttemptDir from `omo ulw-loop status --json`, .omo/evidence/ulw/<session>/<goalId>/a<attempt>)

  Scenario: Reduced motion and production exclusion
    Tool:     bash
    Steps:    Run `bunx playwright test apps/web/e2e/primitive-showcase.spec.ts --project=chrome --grep "reduced motion" && bun run --filter @conf/web build && ! rg "react-grab|react-scan|__showcase" apps/web/dist`.
    Expected: Reduced-motion test passes; production bundle scan exits 0 because no dev tooling/showcase marker is present.
    Evidence: <attemptDir>/task-9-primitives-error.txt
  ```

  Commit: YES | Message: `feat(web): establish accessible design primitives` | Files: [`apps/web/src/styles/**`, `apps/web/src/components/ui/**`, `apps/web/src/dev/**`, `apps/web/src/main.tsx`, `apps/web/src/router.tsx`, `apps/web/e2e/primitive-showcase.spec.ts`, `apps/web/vite.config.ts`]

- [ ] 10. Implement ingest, semantic change review, version publication, and operator CLIs

  What to do: Create `packages/crawler/src/ingest/pipeline.ts`, `change-policy.ts`, `review-policy.ts`, `version-builder.ts`, `commands/crawl.ts`, `commands/review.ts`, and RED-first integration tests over temp copies of seed state. Pipeline is fetch outcome -> immutable snapshot -> parser -> observations -> candidate aggregate -> semantic diff -> auto-accept or review -> optional new version. Exact policy: 304/identical SHA skips parsing and versioning; changed bytes with identical normalized aggregate records snapshot/observations but no version; first complete observation with confidence >=0.90 and explicit timezone can auto-accept; any published deadline change, conflict, confidence <0.90, or ambiguity creates a pending task and leaves `currentVersionId` unchanged. Review acceptance marks observations accepted and publishes one next-numbered immutable version with before/after observation IDs; rejection marks observations rejected, closes the task, and leaves version unchanged. CLI syntax: `bun run crawl -- --source <registered-id> [--fixture <manifest-key>|--live] --data-dir <path>` (fixture required by default; `--live` explicit) and `bun run review -- list|resolve <task-id> (--accept|--reject) --note <text> --data-dir <path>`. Blocked live fetch exits non-zero with a typed/sanitized reason and does not mutate accepted versions. Update README operator runbook. RED: first ingest, repeat, irrelevant change, material change, accept, reject, malformed parse, and CLI argument tests. GREEN: implement idempotently with repository transactions.
  Must NOT do: Do not schedule background jobs, expose HTTP write routes, auto-accept changed deadlines, edit seed data, accept a URL, allow blank resolution notes, or print body content/secrets.

  Parallelization: Can parallel: YES | Wave 3 | Blocks: [final verification] | Blocked by: [2, 4, 5, 6, 7]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `packages/crawler/src/snapshot-capture.ts` - immutable fetch outcome consumed by pipeline
  - API/Type: `packages/storage/src/catalog-repository.ts:CatalogRepository` - atomic persistence boundary
  - Test:     `packages/crawler/src/ingest/pipeline.integration.test.ts` - full deterministic lifecycle
  - External: `https://www.w3.org/TR/prov-dm/` - source/snapshot/observation/version derivation

  Acceptance criteria (agent-executable only):
  - [ ] `bun test packages/crawler/src/ingest packages/crawler/src/commands` exits 0 for all lifecycle and CLI cases.
  - [ ] Two fixture ingests with fixed clock/IDs produce byte-identical state after the first accepted version; deadline-change fixture creates exactly one pending review and does not change `currentVersionId`.
  - [ ] Accepting that task creates version N+1 with one material change and preserved old/new evidence; rejecting in a fresh run leaves version N and records resolution note/time.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: in Codex, use `browser:control-in-app-browser` first when available and no authenticated/persistent user browser profile is required; otherwise use Chrome to drive the page, or agent-browser (https://github.com/vercel-labs/agent-browser) when Chrome is unavailable. Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: Fixture crawl then reviewed change creates version history
    Tool:     bash
    Steps:    Use `mktemp -d`; copy `data/seed/*` into it; run `bun run crawl -- --source cui-2026-official --fixture cui-2026-deadline-change --data-dir "$DIR"`; run `bun run review -- list --data-dir "$DIR"`; resolve the emitted task with `--accept --note "공식 페이지 변경 확인"`; inspect state with `bun scripts/inspect-state.ts "$DIR"`.
    Expected: One pending task becomes accepted; published version increments exactly once; old/new observation IDs and source snapshot remain queryable.
    Evidence: <attemptDir>/task-10-ingest.txt   (attemptDir = currentAttemptDir from `omo ulw-loop status --json`, .omo/evidence/ulw/<session>/<goalId>/a<attempt>)

  Scenario: Malformed fixture and unregistered source fail safely
    Tool:     bash
    Steps:    In a temp data dir run malformed fixture ingest, then `bun run crawl -- --source https://example.com --live --data-dir "$DIR"`; capture exit codes and compare accepted version before/after.
    Expected: Malformed input creates a reviewable parser task without deadline; URL-shaped source is rejected as `UNKNOWN_SOURCE`; accepted version is unchanged.
    Evidence: <attemptDir>/task-10-ingest-error.txt
  ```

  Commit: YES | Message: `feat(crawler): review semantic deadline changes` | Files: [`packages/crawler/src/ingest/**`, `packages/crawler/src/commands/**`, `scripts/inspect-state.ts`, `README.md`]

- [ ] 11. Wire the public Hono API to real catalog data

  What to do: Complete `apps/api/src/server.ts`, repository composition, DTO mappers under `apps/api/src/mappers/`, and route implementations/tests. Runtime parses `DATA_DIR` and `PORT` via Zod; default data directory is read-only `data/seed` and default port is 3000. All endpoints are GET-only and return deterministic stable ordering: editions by next accepted deadline then acronym/year; deadlines by UTC instant then track; evidence by field path/source priority; versions newest first. `health` reports status and catalog generation time but no filesystem path. Search must match acronym, series/name, track, and deadline labels case-insensitively for Latin and by substring for Korean; pagination cursor is opaque base64url of stable sort key and invalid cursors are 400. Detail/evidence/history map only accepted published data; pending/rejected observations never leak into public output. Add `Cache-Control: no-store` for health/problem and `public, max-age=60` for read catalog responses. RED: real seed, search, ordering, empty temp state, malformed cursor/query, missing ID, evidence, history, and pending-data exclusion. GREEN: wire repository and server composition.
  Must NOT do: Do not add CORS wildcard, mutation/admin routes, expose review task IDs/body refs/data dir/stack traces, bind during tests, or serve unreviewed candidates.

  Parallelization: Can parallel: YES | Wave 3 | Blocks: [final verification] | Blocked by: [5, 8]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `apps/api/src/app.ts:createApp` - dependency-injected Hono application
  - API/Type: `packages/contracts/src/edition.ts` - public request/response contract
  - Test:     `apps/api/src/app.integration.test.ts` - real seed/temp repository HTTP assertions
  - External: `https://hono.dev/docs/getting-started/bun` - Bun server entry separation

  Acceptance criteria (agent-executable only):
  - [ ] `bun test apps/api` exits 0 and tests every public route with populated, empty, malformed, and missing data.
  - [ ] With `DATA_DIR=data/seed bun run --filter @conf/api start`, curl responses validate through `packages/contracts` and contain evidence/history but no pending review task/body path.
  - [ ] `curl -sS 'http://127.0.0.1:3000/api/v1/editions?year=oops'` returns 400 problem JSON; `.../ed_missing` returns 404; an empty temp catalog returns 200 `items: []`.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: in Codex, use `browser:control-in-app-browser` first when available and no authenticated/persistent user browser profile is required; otherwise use Chrome to drive the page, or agent-browser (https://github.com/vercel-labs/agent-browser) when Chrome is unavailable. Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: Search, detail, evidence, and history are publicly coherent
    Tool:     curl
    Steps:    Start `DATA_DIR=data/seed bun run --filter @conf/api start`; request `/api/v1/editions?query=CUI`, take the first ID, then request its detail, `/evidence`, and `/history`; validate each body with `bun scripts/validate-api-response.ts`.
    Expected: All return 200, reference the same edition/currentVersionId, contain only accepted data, and every deadline evidence points to a source URL/snapshot metadata.
    Evidence: <attemptDir>/task-11-api.json   (attemptDir = currentAttemptDir from `omo ulw-loop status --json`, .omo/evidence/ulw/<session>/<goalId>/a<attempt>)

  Scenario: Empty and malformed requests remain stable
    Tool:     curl
    Steps:    Start API against an empty valid temp state; request `/api/v1/editions`; then request `?limit=101`, `?year=nope`, invalid cursor, and `/api/v1/editions/ed_missing`.
    Expected: Empty is 200 with `items: []`; malformed cases are 400 problem JSON with field issues; missing well-formed ID is 404; no response includes a stack/path.
    Evidence: <attemptDir>/task-11-api-error.json
  ```

  Commit: YES | Message: `feat(api): serve accepted deadline catalog` | Files: [`apps/api/src/server.ts`, `apps/api/src/mappers/**`, `apps/api/src/routes/**`, `apps/api/src/*.test.ts`, `scripts/validate-api-response.ts`]

- [ ] 12. Build the searchable list/calendar homepage

  What to do: Create `apps/web/src/api/client.ts`, `api/errors.ts`, `hooks/useEditionSearch.ts`, `routes/HomePage.tsx`, and `features/catalog/{SearchToolbar,ViewToggle,EditionList,EditionCard,DeadlineCalendar,CalendarMonth,ResultsSummary}.tsx` with CSS modules and RED-first tests. The client parses every response with contracts Zod and returns typed `success | empty | problem | network-error`. Homepage headline is “학회 마감 일정”; search/filter/view state lives in URL parameters (`query`, `year`, `track`, `view=list|calendar`) and is restorable by back/forward/reload. Debounce input 200ms but update immediately on submit; abort stale requests. List cards show acronym/year, full name, next accepted deadline, track/kind, UTC plus source zone label, evidence availability, and change badge. Calendar desktop/tablet is a semantic month grid; at 375px it becomes chronological month agenda, never a squeezed seven-column grid. Loading uses skeleton with stable geometry; empty copy is “검색 결과가 없습니다”; malformed/network states provide a Korean retry action. Preserve focus on view changes and announce result counts through a polite live region. RED: URL state, search abort, list ordering render, month grouping, mobile mode, loading/empty/problem, keyboard, and accessible names. GREEN: implement against injected typed client/fake responses; final verification wires the real API.
  Must NOT do: Do not compute/display pending deadlines, place filter state only in component memory, use an unlabelled icon-only toggle, render a horizontally scrolling mobile grid, show raw parser confidence as the primary deadline, or invent relative times in tests without an injected clock.

  Parallelization: Can parallel: YES | Wave 3 | Blocks: [final verification] | Blocked by: [3, 8, 9]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `apps/web/src/components/ui/StatePanel.tsx` - loading/empty/error/retry states
  - API/Type: `packages/contracts/src/edition.ts:EditionListResponseSchema` - client parse boundary
  - Test:     `apps/web/src/routes/HomePage.test.tsx` - URL-state and response-state matrix
  - External: `https://www.w3.org/WAI/ARIA/apg/patterns/grid/` - only if interactive grid semantics are used; otherwise use list/table semantics

  Acceptance criteria (agent-executable only):
  - [ ] `bun run --filter @conf/web test -- HomePage` exits 0 for populated, Korean/Latin search, empty, malformed, network, list/calendar, back-forward, stale-response abort, and keyboard cases.
  - [ ] Playwright at 375/768/1280 proves search and filters update the URL, list/calendar switch preserves filters, result count is announced, and primary content has no horizontal overflow.
  - [ ] `bun run typecheck && bun run lint` passes with all API JSON parsed before use and no `dangerouslySetInnerHTML`.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: in Codex, use `browser:control-in-app-browser` first when available and no authenticated/persistent user browser profile is required; otherwise use Chrome to drive the page, or agent-browser (https://github.com/vercel-labs/agent-browser) when Chrome is unavailable. Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: Researcher finds and switches view at three widths
    Tool:     playwright(real Chrome)
    Steps:    Run `bunx playwright test apps/web/e2e/home.spec.ts --project=chrome`; spec visits `/`, types `CUI`, chooses a year, asserts URL, switches list/calendar, tabs through results, and captures 375/768/1280.
    Expected: Matching accepted edition remains visible, state survives reload, mobile calendar is agenda, desktop is month grid, evidence/change cues are labelled, and no primary overflow occurs.
    Evidence: <attemptDir>/task-12-home.png   (attemptDir = currentAttemptDir from `omo ulw-loop status --json`, .omo/evidence/ulw/<session>/<goalId>/a<attempt>)

  Scenario: Empty and malformed API states recover without losing query
    Tool:     playwright(real Chrome)
    Steps:    Run `bunx playwright test apps/web/e2e/home.spec.ts --project=chrome --grep "empty and malformed"`; intercept list response first as empty, then as 400 problem, then successful after pressing “다시 시도”.
    Expected: Exact empty copy appears, problem detail is safely summarized in Korean, retry restores results, URL query remains, and focus moves to results heading.
    Evidence: <attemptDir>/task-12-home-error.png
  ```

  Commit: YES | Message: `feat(web): add searchable deadline calendar` | Files: [`apps/web/src/api/**`, `apps/web/src/hooks/**`, `apps/web/src/routes/HomePage.tsx`, `apps/web/src/features/catalog/**`, `apps/web/e2e/home.spec.ts`]

- [ ] 13. Build edition detail with evidence and immutable change history

  What to do: Create `apps/web/src/routes/EditionDetailPage.tsx` and `features/edition/{EditionHeader,TrackDeadlineList,DeadlineRow,EvidencePanel,SourceMetadata,ChangeTimeline,ChangeEntry}.tsx` with CSS modules and RED-first tests. The route loads detail/evidence/history concurrently with AbortSignal and schema-parses each. Show edition dates/status, accepted deadlines grouped by track, original timezone/raw source text, source kind and official external link, checked timestamp/ETag/Last-Modified/hash prefix, parser version/locator, and confidence as secondary provenance metadata. “근거 보기” opens an accessible inline disclosure/drawer that returns focus to its trigger; “변경 이력” lists immutable versions newest-first with field, old/new normalized value, accepted time, and both observation/source references. At 375px tables become labelled definition/list rows; at 768/1280 retain aligned dense columns. Include loading, missing 404, malformed evidence/history, and no-history states. External links use safe `rel`; raw text is rendered as text only. Reduced motion replaces drawer/timeline transform with instant/opacity state. RED: grouped deadlines, focus management, provenance field mapping, version ordering, missing/malformed partial failure, long Korean text, and keyboard tests. GREEN: implement with Task 9 primitives.
  Must NOT do: Do not render raw HTML, show body paths/full hashes unnecessarily, expose pending/rejected observations, hide source conflicts, use color alone for changes, or fail the entire detail when evidence/history is unavailable; show a labelled partial-error state beside accepted data.

  Parallelization: Can parallel: YES | Wave 3 | Blocks: [final verification] | Blocked by: [3, 8, 9]

  References (executor has NO interview context - be exhaustive):
  - Pattern:  `apps/web/src/components/ui/EvidenceLink.tsx` - evidence affordance/focus style
  - API/Type: `packages/contracts/src/evidence.ts` and `packages/contracts/src/history.ts` - only rendered provenance/version fields
  - Test:     `apps/web/src/routes/EditionDetailPage.test.tsx` - detail/partial-failure/accessibility matrix
  - External: `https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/` - evidence disclosure keyboard semantics

  Acceptance criteria (agent-executable only):
  - [ ] `bun run --filter @conf/web test -- EditionDetailPage` exits 0 for evidence/history, no history, 404, malformed partial response, keyboard focus, reduced motion, and long-content cases.
  - [ ] Playwright at 375/768/1280 opens evidence for a deadline, verifies source/snapshot/parser/raw/normalized data, closes it with Escape, and walks a before/after history entry without overflow.
  - [ ] Accessibility assertions prove headings/landmarks, deadline list/table semantics, non-color change labels, external-link names, and focus restoration.

  QA scenarios (MANDATORY - task incomplete without these):
  > Name the exact tool AND its exact invocation - not "verify it works". Browser use: in Codex, use `browser:control-in-app-browser` first when available and no authenticated/persistent user browser profile is required; otherwise use Chrome to drive the page, or agent-browser (https://github.com/vercel-labs/agent-browser) when Chrome is unavailable. Computer use: OS-level GUI automation for a non-browser desktop app.
  ```
  Scenario: Detail explains a deadline and its change
    Tool:     playwright(real Chrome)
    Steps:    Run `bunx playwright test apps/web/e2e/detail.spec.ts --project=chrome`; spec opens seeded edition, activates “근거 보기”, checks source/check/parser/raw/AoE fields, closes with Escape, then opens “변경 이력” and checks old/new values at 375/768/1280.
    Expected: Accepted deadline, exact source lineage, and immutable change are coherent; focus returns correctly; mobile reflows; screenshots contain no clipped/overlapping text.
    Evidence: <attemptDir>/task-13-detail.png   (attemptDir = currentAttemptDir from `omo ulw-loop status --json`, .omo/evidence/ulw/<session>/<goalId>/a<attempt>)

  Scenario: Missing or malformed auxiliary data degrades locally
    Tool:     playwright(real Chrome)
    Steps:    Run `bunx playwright test apps/web/e2e/detail.spec.ts --project=chrome --grep "partial failure"`; serve valid detail plus malformed evidence and 500 history, then keyboard-navigate retry controls.
    Expected: Accepted deadline remains readable; evidence/history each shows a Korean labelled error/retry; no raw JSON/stack appears; focus is preserved.
    Evidence: <attemptDir>/task-13-detail-error.png
  ```

  Commit: YES | Message: `feat(web): explain deadline evidence and changes` | Files: [`apps/web/src/routes/EditionDetailPage.tsx`, `apps/web/src/features/edition/**`, `apps/web/e2e/detail.spec.ts`]

## Final verification wave (MANDATORY - after all implementation tasks)
> Runs in PARALLEL. ALL must APPROVE. Surface results to the caller and wait for an explicit "okay" before declaring complete.
- [ ] F1. Plan compliance audit - run `bun install --frozen-lockfile && bun run typecheck && bun run lint && bun run test && bun run build`; map every Must-Have, task criterion, file boundary, and evidence artifact to pass/fail in `<attemptDir>/final-plan-compliance.md`; verify every Must-NOT-Have with targeted `rg`/manifest/API route checks.
- [ ] F2. Code quality review - run TypeScript diagnostics, Biome, React Doctor, dependency/route review, and `find apps packages -type f \( -name '*.ts' -o -name '*.tsx' \) -print0 | xargs -0 -n1 awk '!/^[[:space:]]*$/ && !/^[[:space:]]*(\/\/|#)/ {n++} END {if(n>250){print FILENAME ":" n; exit 1}}'`; confirm readonly/Zod boundaries, typed errors, exhaustive unions, no dead code, no source file over 250 pure LOC, no public mutation route, and no arbitrary-fetch API. Record `<attemptDir>/final-code-quality.md`.
- [ ] F3. Real manual QA - start API against a temp copy of `data/seed` and web production preview; run all Playwright scenarios with real Chrome at 375/768/1280, keyboard-only, 200% zoom, and reduced motion; run the fixture crawl/review lifecycle; capture per-route screenshots, traces, curl bodies, and browser console/network errors under `<attemptDir>/final-manual-qa/`. Require exact Korean copy, no horizontal overflow, visible focus, accepted-only public data, evidence/history coherence, and successful recovery from empty/malformed/404/partial-failure states.
- [ ] F4. Scope fidelity - inspect `git diff --stat $(git rev-list --max-parents=0 HEAD)..HEAD`, workspace manifests, routes, CLI commands, network call sites, and ignored output. Approve only if one registered live source plus deterministic three-shape fixtures shipped, no database/scheduler/auth/deployment/notification/ICS/account feature appeared, no credentials were invented, and unreviewed changes cannot reach public API. Record `<attemptDir>/final-scope-fidelity.md`.

## Commit strategy
- One logical change per commit. Conventional Commits (`<type>(<scope>): <subject>` body + footer).
- Atomic: every commit builds and passes tests on its own.
- No "WIP" / "fix typo squash later" commits on the final branch - clean up before merge.
- Reference the plan file path in the final commit footer: `Plan: .omo/plans/conference-deadline-platform.md`.

## Success criteria
- All Must-Have shipped; all QA scenarios pass with captured evidence; F1-F4 approved; commit history clean.
