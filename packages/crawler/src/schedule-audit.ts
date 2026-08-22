import type { Catalog, Edition } from "@conf/contracts"

export interface StaleFutureScheduleFinding {
  readonly editionId: string
  readonly acronym: string
  readonly year: number
  readonly officialUrl: string
  readonly kind: "future-edition-has-only-past-schedule"
  readonly staleDeadlineIds: readonly string[]
  readonly staleConferenceDates: readonly string[]
}

function localDateIso(now: Date): string {
  return now.toISOString().slice(0, 10)
}

function staleConferenceDates(edition: Edition, today: string): readonly string[] {
  return [edition.conferenceStart, edition.conferenceEnd].filter(
    (date): date is string => date !== null && date < today,
  )
}

function hasOnlyPastSchedule(edition: Edition, now: Date): boolean {
  const today = localDateIso(now)
  const hasConferenceDate = edition.conferenceStart !== null || edition.conferenceEnd !== null
  const hasDeadline = edition.deadlines.length > 0
  if (!hasConferenceDate && !hasDeadline) return false

  const allDeadlinesArePast = edition.deadlines.every(
    (deadline) => new Date(deadline.dueAtUtc).getTime() < now.getTime(),
  )
  const allConferenceDatesArePast = [edition.conferenceStart, edition.conferenceEnd]
    .filter((date): date is string => date !== null)
    .every((date) => date < today)

  return allDeadlinesArePast && allConferenceDatesArePast
}

/**
 * Finds a dangerous data shape without guessing replacement dates. A future
 * edition that contains only elapsed milestones must wait for an official
 * announcement instead of displaying a copied prior-year schedule.
 */
export function auditFutureEditionSchedules(
  catalog: Catalog,
  now = new Date(),
): readonly StaleFutureScheduleFinding[] {
  const currentYear = now.getUTCFullYear()
  const today = localDateIso(now)
  return catalog.editions
    .filter(
      (edition) =>
        edition.year > currentYear &&
        edition.status !== "dates-pending" &&
        hasOnlyPastSchedule(edition, now),
    )
    .map(
      (edition): StaleFutureScheduleFinding => ({
        editionId: edition.id,
        acronym: edition.acronym,
        year: edition.year,
        officialUrl: edition.officialUrl,
        kind: "future-edition-has-only-past-schedule",
        staleDeadlineIds: edition.deadlines
          .filter((deadline) => new Date(deadline.dueAtUtc).getTime() < now.getTime())
          .map((deadline) => deadline.id),
        staleConferenceDates: staleConferenceDates(edition, today),
      }),
    )
    .sort((left, right) => left.editionId.localeCompare(right.editionId))
}

export function formatScheduleAuditReport(findings: readonly StaleFutureScheduleFinding[]): string {
  const lines = ["# Future-edition schedule safety review", ""]
  if (findings.length === 0)
    return [...lines, "No stale future-edition schedules detected."].join("\n")

  lines.push(
    `${findings.length} future edition(s) contain only elapsed schedule values.`,
    "",
    "Do not infer or roll dates forward. Clear the stale schedule, set the edition to `dates-pending`, and verify the official URL before publishing a replacement.",
    "",
  )
  for (const finding of findings) {
    lines.push(
      `## ${finding.acronym} (${finding.editionId})`,
      "",
      `Official URL: ${finding.officialUrl}`,
      `Stale deadlines: ${finding.staleDeadlineIds.join(", ") || "none"}`,
      `Stale conference dates: ${finding.staleConferenceDates.join(", ") || "none"}`,
      "",
    )
  }
  return lines.join("\n")
}
