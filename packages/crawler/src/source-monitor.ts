import { mkdir } from "node:fs/promises"
import { dirname } from "node:path"
import { type Catalog, catalogSchema } from "@conf/contracts"
import { z } from "zod"
import { parseOfficialHtml } from "./parsers"
import { fetchRegisteredHtml } from "./safe-fetch"
import {
  applyScheduleProposals,
  buildScheduleProposals,
  formatScheduleProposalReport,
  type ScheduleProposal,
  type SourcePageObservations,
} from "./schedule-sync"
import type { RegisteredSource } from "./source-registry"

const availableCheckSchema = z.object({
  id: z.string().min(1),
  canonicalUrl: z.string().url(),
  finalUrl: z.string().url(),
  kind: z.literal("available"),
  sha256: z.string().min(1),
})

const unavailableCheckSchema = z.object({
  id: z.string().min(1),
  canonicalUrl: z.string().url(),
  kind: z.literal("unavailable"),
  reason: z.string().min(1),
})

const sourceStateSchema = z.object({
  schemaVersion: z.literal(1),
  sources: z.record(
    z.string(),
    z.discriminatedUnion("kind", [availableCheckSchema, unavailableCheckSchema]),
  ),
})

export type SourceCheck = z.infer<typeof sourceStateSchema>["sources"][string]

export interface SourceState {
  readonly schemaVersion: 1
  readonly sources: Readonly<Record<string, SourceCheck>>
}

export interface MonitorSource {
  readonly id: string
  readonly editionId: string
  readonly name: string
  readonly canonicalUrl: string
}

const sourceChangeKinds = [
  "initial",
  "url-moved",
  "content-changed",
  "availability-changed",
] as const

export type SourceChangeKind = (typeof sourceChangeKinds)[number]

export interface SourceChange {
  readonly id: string
  readonly kind: SourceChangeKind
  readonly canonicalUrl: string
  readonly previous: SourceCheck | undefined
  readonly next: SourceCheck
}

export interface MonitorRun {
  readonly sources: readonly MonitorSource[]
  readonly state: SourceState
  readonly changes: readonly SourceChange[]
  readonly scheduleProposals: readonly ScheduleProposal[]
}

function registeredSource(source: MonitorSource): RegisteredSource | undefined {
  const url = new URL(source.canonicalUrl)
  if (url.protocol !== "https:") return undefined
  return {
    id: source.id,
    canonicalUrl: source.canonicalUrl,
    allowedHosts: [url.hostname],
    adapter: "official-html",
  }
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export function monitorSources(catalog: Catalog): readonly MonitorSource[] {
  return catalog.editions
    .flatMap((edition) => [
      {
        id: edition.id,
        editionId: edition.id,
        name: edition.acronym,
        canonicalUrl: edition.officialUrl,
      },
      ...(edition.additionalSourceUrls ?? []).map((canonicalUrl, index) => ({
        id: `${edition.id}:additional-${index + 1}`,
        editionId: edition.id,
        name: edition.acronym,
        canonicalUrl,
      })),
    ])
    .sort((left, right) => left.id.localeCompare(right.id))
}

export function createSourceState(checks: readonly SourceCheck[]): SourceState {
  return {
    schemaVersion: 1,
    sources: Object.fromEntries(checks.map((check) => [check.id, check])),
  }
}

export function compareSourceStates(
  previous: SourceState,
  next: SourceState,
): readonly SourceChange[] {
  const changes: SourceChange[] = []
  for (const nextCheck of Object.values(next.sources)) {
    const previousCheck = previous.sources[nextCheck.id]
    if (!previousCheck) {
      changes.push({
        id: nextCheck.id,
        kind: "initial",
        canonicalUrl: nextCheck.canonicalUrl,
        previous: undefined,
        next: nextCheck,
      })
      continue
    }
    if (
      previousCheck.kind === "available" &&
      nextCheck.kind === "available" &&
      previousCheck.finalUrl !== nextCheck.finalUrl
    ) {
      changes.push({
        id: nextCheck.id,
        kind: "url-moved",
        canonicalUrl: nextCheck.canonicalUrl,
        previous: previousCheck,
        next: nextCheck,
      })
      continue
    }
    if (
      previousCheck.kind === "available" &&
      nextCheck.kind === "available" &&
      previousCheck.sha256 !== nextCheck.sha256
    ) {
      changes.push({
        id: nextCheck.id,
        kind: "content-changed",
        canonicalUrl: nextCheck.canonicalUrl,
        previous: previousCheck,
        next: nextCheck,
      })
      continue
    }
    if (previousCheck.kind !== nextCheck.kind)
      changes.push({
        id: nextCheck.id,
        kind: "availability-changed",
        canonicalUrl: nextCheck.canonicalUrl,
        previous: previousCheck,
        next: nextCheck,
      })
  }
  return changes
}

interface SourceCheckResult {
  readonly check: SourceCheck
  readonly page: SourcePageObservations | undefined
}

async function checkSource(source: MonitorSource): Promise<SourceCheckResult> {
  const registered = registeredSource(source)
  if (!registered)
    return {
      check: {
        id: source.id,
        canonicalUrl: source.canonicalUrl,
        kind: "unavailable",
        reason: "non-https-source",
      },
      page: undefined,
    }
  try {
    const fetched = await fetchRegisteredHtml(registered)
    const checkedAt = new Date().toISOString()
    return {
      check: {
        id: source.id,
        canonicalUrl: source.canonicalUrl,
        finalUrl: fetched.finalUrl,
        kind: "available",
        sha256: await sha256(fetched.body),
      },
      page: {
        editionId: source.editionId,
        sourceUrl: source.canonicalUrl,
        finalUrl: fetched.finalUrl,
        checkedAt,
        observations: parseOfficialHtml(fetched.body),
      },
    }
  } catch (error: unknown) {
    if (error instanceof Error)
      return {
        check: {
          id: source.id,
          canonicalUrl: source.canonicalUrl,
          kind: "unavailable",
          reason: error.name,
        },
        page: undefined,
      }
    throw error
  }
}

export async function readSourceState(path: string): Promise<SourceState> {
  const file = Bun.file(path)
  if (!(await file.exists())) return createSourceState([])
  return sourceStateSchema.parse(await file.json())
}

export async function runSourceMonitor(
  catalogPath: string,
  statePath: string,
): Promise<MonitorRun> {
  const catalog = catalogSchema.parse(await Bun.file(catalogPath).json())
  const sources = monitorSources(catalog)
  const previous = await readSourceState(statePath)
  const checks: SourceCheck[] = []
  const pages: SourcePageObservations[] = []
  for (const source of sources) {
    const result = await checkSource(source)
    checks.push(result.check)
    if (result.page) pages.push(result.page)
  }
  const state = createSourceState(checks)
  return {
    sources,
    state,
    changes: compareSourceStates(previous, state),
    scheduleProposals: buildScheduleProposals(catalog, pages),
  }
}

export function formatMonitorReport(run: MonitorRun): string {
  const lines = ["# Monthly official-source review", ""]
  if (run.changes.length === 0) lines.push("No source changes detected.", "")
  else {
    lines.push(`${run.changes.length} source change(s) require review.`, "")
    for (const change of run.changes) {
      lines.push(`## ${change.id}: ${change.kind}`, "", `Official URL: ${change.canonicalUrl}`, "")
      if (change.previous?.kind === "available")
        lines.push(`Previous fingerprint: ${change.previous.sha256}`)
      if (change.next.kind === "available") {
        lines.push(
          `Current URL: ${change.next.finalUrl}`,
          `Current fingerprint: ${change.next.sha256}`,
        )
      } else lines.push(`Check result: ${change.next.reason}`)
      lines.push("")
    }
  }
  return [...lines, formatScheduleProposalReport(run.scheduleProposals)].join("\n")
}

export async function writeMonitorReview(
  statePath: string,
  reportPath: string,
  run: MonitorRun,
): Promise<void> {
  await mkdir(dirname(statePath), { recursive: true })
  await mkdir(dirname(reportPath), { recursive: true })
  await Bun.write(statePath, `${JSON.stringify(run.state, null, 2)}\n`)
  await Bun.write(reportPath, `${formatMonitorReport(run)}\n`)
}

export async function writeScheduleUpdates(
  catalogPath: string,
  catalog: Catalog,
  run: MonitorRun,
): Promise<void> {
  if (run.scheduleProposals.length === 0) return
  const next = applyScheduleProposals(catalog, run.scheduleProposals)
  await Bun.write(catalogPath, `${JSON.stringify(next, null, 2)}\n`)
}
