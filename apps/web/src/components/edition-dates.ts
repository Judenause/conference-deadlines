import type { Deadline, Edition } from "@conf/contracts"

export const MONTH_MARKERS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const

export interface CalendarEvent {
  readonly id: string
  readonly edition: Edition
  readonly date: string
  readonly label: string
  readonly timeLabel: string
  readonly type: "deadline" | "conference"
}

export interface CalendarEventGroup {
  readonly key: string
  readonly marker: string
  readonly label: string
  readonly events: readonly CalendarEvent[]
}

function displayDateIso(deadline: Deadline): string | undefined {
  const match = deadline.displayDate.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/)
  if (!match) return undefined
  const [, year, month, day] = match
  return `${year}-${month?.padStart(2, "0")}-${day?.padStart(2, "0")}`
}

export function paperSubmission(edition: Edition): Deadline | undefined {
  return edition.deadlines.find((deadline) => deadline.kind === "paper_submission")
}

export function editionAnchorDate(edition: Edition, today: string): string | undefined {
  const futureDeadlines = edition.deadlines
    .map(displayDateIso)
    .filter((date): date is string => date !== undefined && date >= today)
    .sort()
  if (futureDeadlines[0]) return futureDeadlines[0]
  if (edition.conferenceStart && edition.conferenceStart >= today) return edition.conferenceStart
  const fallbackDeadline = paperSubmission(edition) ?? edition.deadlines[0]
  return (
    (fallbackDeadline ? displayDateIso(fallbackDeadline) : undefined) ??
    edition.conferenceStart ??
    undefined
  )
}

export function groupEditions(editions: readonly Edition[]): readonly {
  key: string
  marker: string
  label: string
  editions: readonly Edition[]
}[] {
  const today = new Date().toISOString().slice(0, 10)
  const groups = new Map<string, { marker: string; label: string; editions: Edition[] }>()
  const ordered = [...editions].sort((left, right) => {
    const leftDate = editionAnchorDate(left, today)
    const rightDate = editionAnchorDate(right, today)
    if (leftDate && rightDate) return leftDate.localeCompare(rightDate)
    if (leftDate) return -1
    if (rightDate) return 1
    return left.year - right.year || left.acronym.localeCompare(right.acronym)
  })

  for (const edition of ordered) {
    const anchor = editionAnchorDate(edition, today)
    const [year, monthValue] = anchor?.split("-") ?? []
    const month = Number(monthValue)
    const hasMonth = Boolean(year) && Number.isInteger(month) && month >= 1 && month <= 12
    const key = hasMonth ? `${year}-${String(month).padStart(2, "0")}` : `${edition.year}-pending`
    const marker = hasMonth ? (MONTH_MARKERS[month - 1] ?? "DATE") : String(edition.year)
    const label = hasMonth ? `${year}년 ${month}월 · 다음 일정` : `${edition.year}년 · 일정 미공개`
    const existing = groups.get(key)
    if (existing) existing.editions.push(edition)
    else groups.set(key, { marker, label, editions: [edition] })
  }

  return [...groups].map(([key, group]) => ({ key, ...group }))
}

export function calendarEventGroups(editions: readonly Edition[]): readonly CalendarEventGroup[] {
  const today = new Date().toISOString().slice(0, 10)
  const events = editions.flatMap((edition): CalendarEvent[] => {
    const deadlines = edition.deadlines.flatMap((deadline): CalendarEvent[] => {
      const date = displayDateIso(deadline)
      if (!date || date < today) return []
      return [
        {
          id: `${edition.id}-${deadline.id}`,
          edition,
          date,
          label: deadline.label,
          timeLabel: deadline.displayDate.split(" ").slice(3).join(" ") || "23:59",
          type: "deadline",
        },
      ]
    })
    const conference =
      edition.conferenceStart && edition.conferenceStart >= today
        ? [
            {
              id: `${edition.id}-conference`,
              edition,
              date: edition.conferenceStart,
              label: "학회 개최",
              timeLabel: edition.dateRange,
              type: "conference" as const,
            },
          ]
        : []
    return [...deadlines, ...conference]
  })
  const grouped = new Map<string, CalendarEvent[]>()
  for (const event of events.sort((left, right) => left.date.localeCompare(right.date))) {
    const key = event.date.slice(0, 7)
    const existing = grouped.get(key)
    if (existing) existing.push(event)
    else grouped.set(key, [event])
  }
  return [...grouped].map(([key, groupEvents]) => {
    const [year, monthValue] = key.split("-")
    const month = Number(monthValue)
    return {
      key,
      marker: MONTH_MARKERS[month - 1] ?? "DATE",
      label: `${year}년 ${month}월`,
      events: groupEvents,
    }
  })
}

export function eventDay(event: CalendarEvent): number {
  return Number(event.date.slice(8, 10))
}
