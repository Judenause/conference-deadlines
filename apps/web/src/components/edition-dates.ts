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

export type DeadlineUrgency = "primary" | "neutral" | "warning" | "danger" | "closed"

export interface DeadlineCountdown {
  readonly label: string
  readonly urgency: DeadlineUrgency
}

export function deadlineDateIso(deadline: Deadline): string | undefined {
  const match = deadline.displayDate.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/)
  if (!match) return undefined
  const [, year, month, day] = match
  return `${year}-${month?.padStart(2, "0")}-${day?.padStart(2, "0")}`
}

export function localDateIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function isUpcomingDeadline(deadline: Deadline, now: Date): boolean {
  return new Date(deadline.dueAtUtc).getTime() >= now.getTime()
}

export function deadlineCountdown(deadline: Deadline, now: Date): DeadlineCountdown {
  const remaining = new Date(deadline.dueAtUtc).getTime() - now.getTime()
  if (remaining < 0) return { label: "CLOSED", urgency: "closed" }
  const days = Math.ceil(remaining / 86_400_000)
  if (days <= 1) return { label: "TODAY", urgency: "danger" }
  if (days <= 3) return { label: `D-${days}`, urgency: "danger" }
  if (days <= 7) return { label: `D-${days}`, urgency: "warning" }
  if (days <= 30) return { label: `D-${days}`, urgency: "neutral" }
  return { label: `D-${days}`, urgency: "primary" }
}

export function nextUpcomingDeadline(edition: Edition, now: Date): Deadline | undefined {
  return [...edition.deadlines]
    .filter((deadline) => isUpcomingDeadline(deadline, now))
    .sort((left, right) => left.dueAtUtc.localeCompare(right.dueAtUtc))[0]
}

export function isConferenceCurrentOrUpcoming(edition: Edition, now: Date): boolean {
  const conferenceLastDay = edition.conferenceEnd ?? edition.conferenceStart
  return conferenceLastDay ? conferenceLastDay >= localDateIso(now) : false
}

export function isConferenceInProgress(edition: Edition, now: Date): boolean {
  const today = localDateIso(now)
  return Boolean(
    edition.conferenceStart &&
      edition.conferenceStart <= today &&
      (edition.conferenceEnd ?? edition.conferenceStart) >= today,
  )
}

export function hasUpcomingSchedule(edition: Edition, now: Date): boolean {
  if (nextUpcomingDeadline(edition, now)) return true
  if (isConferenceCurrentOrUpcoming(edition, now)) return true
  if (edition.conferenceStart || edition.conferenceEnd || edition.deadlines.length > 0) return false
  return edition.year >= now.getFullYear()
}

export function upcomingEditions(editions: readonly Edition[], now: Date): readonly Edition[] {
  return editions.filter((edition) => hasUpcomingSchedule(edition, now))
}

export function filterEditions(
  editions: readonly Edition[],
  query: string,
  category: string,
): readonly Edition[] {
  const needle = query.trim().toLocaleLowerCase("ko")
  return editions.filter((edition) => {
    const haystack = [
      edition.acronym,
      edition.name,
      edition.location,
      edition.categories.join(" "),
      edition.tier ?? "",
    ]
      .join(" ")
      .toLocaleLowerCase("ko")
    const matchesText = !needle || haystack.includes(needle)
    return matchesText && (category === "전체" || edition.categories.includes(category))
  })
}

export function editionAnchorDate(edition: Edition, now: Date): string | undefined {
  const today = localDateIso(now)
  if (
    edition.conferenceStart &&
    edition.conferenceStart <= today &&
    (edition.conferenceEnd ?? edition.conferenceStart) >= today
  ) {
    return today
  }
  const futureDeadlines = edition.deadlines
    .filter((deadline) => isUpcomingDeadline(deadline, now))
    .map(deadlineDateIso)
    .filter((date): date is string => date !== undefined)
    .map((date) => (date < today ? today : date))
    .sort()
  if (futureDeadlines[0]) return futureDeadlines[0]
  if (edition.conferenceStart && edition.conferenceStart >= today) return edition.conferenceStart
  return undefined
}

export function groupEditions(
  editions: readonly Edition[],
  now = new Date(),
): readonly {
  key: string
  marker: string
  label: string
  editions: readonly Edition[]
}[] {
  const groups = new Map<string, { marker: string; label: string; editions: Edition[] }>()
  const ordered = [...editions].sort((left, right) => {
    const leftDate = editionAnchorDate(left, now)
    const rightDate = editionAnchorDate(right, now)
    if (leftDate && rightDate) return leftDate.localeCompare(rightDate)
    if (leftDate) return -1
    if (rightDate) return 1
    return left.year - right.year || left.acronym.localeCompare(right.acronym)
  })

  for (const edition of ordered) {
    const anchor = editionAnchorDate(edition, now)
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

export function calendarEventGroups(
  editions: readonly Edition[],
  now = new Date(),
): readonly CalendarEventGroup[] {
  const today = localDateIso(now)
  const events = editions.flatMap((edition): CalendarEvent[] => {
    const deadlines = edition.deadlines.flatMap((deadline): CalendarEvent[] => {
      const sourceDate = deadlineDateIso(deadline)
      if (!sourceDate || !isUpcomingDeadline(deadline, now)) return []
      const date = sourceDate < today ? today : sourceDate
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
    const conferenceDate = isConferenceCurrentOrUpcoming(edition, now)
      ? edition.conferenceStart && edition.conferenceStart >= today
        ? edition.conferenceStart
        : today
      : undefined
    const conferenceInProgress = Boolean(
      conferenceDate && edition.conferenceStart && edition.conferenceStart <= today,
    )
    const conference = conferenceDate
      ? [
          {
            id: `${edition.id}-conference`,
            edition,
            date: conferenceDate,
            label: conferenceInProgress ? "학회 진행 중" : "학회 개최",
            timeLabel: conferenceInProgress ? "오늘 진행 중" : edition.dateRange,
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
