import type { Edition } from "@conf/contracts"
import { expect, test } from "vitest"
import {
  calendarEventGroups,
  deadlineCountdown,
  groupEditions,
  groupEditionsByCategory,
  hasUpcomingSchedule,
  nextUpcomingDeadline,
} from "./edition-dates"

const edition = {
  id: "date-visibility-fixture",
  acronym: "DATE 2026",
  name: "Date visibility fixture",
  year: 2026,
  location: "Seoul",
  dateRange: "2026. 11. 1 - 11. 3",
  conferenceStart: "2026-11-01",
  conferenceEnd: "2026-11-03",
  officialUrl: "https://example.com/date-visibility",
  tier: null,
  categories: ["System"],
  status: "confirmed",
  description: "Date visibility fixture",
  registrySource: "curated",
  registrySourceUrl: "https://example.com/date-visibility",
  registryRecordId: null,
  deadlines: [
    {
      id: "paper-past",
      label: "논문 제출",
      kind: "paper_submission",
      dueAtUtc: "2026-08-18T14:59:00Z",
      displayDate: "2026. 8. 18 23:59",
      timezone: "KST (UTC+9)",
      status: "confirmed",
      track: "Main track",
    },
  ],
} satisfies Edition

test("an upcoming conference remains visible without its elapsed paper deadline", () => {
  const now = new Date("2026-08-19T00:00:00Z")

  expect(hasUpcomingSchedule(edition, now)).toBe(true)
  expect(nextUpcomingDeadline(edition, now)).toBeUndefined()
})

test("an edition disappears after its conference and every deadline have elapsed", () => {
  const now = new Date("2026-11-04T00:00:00Z")

  expect(hasUpcomingSchedule(edition, now)).toBe(false)
})

test("an in-progress conference appears today without reviving its elapsed start date", () => {
  const now = new Date("2026-11-02T00:00:00Z")

  const events = calendarEventGroups([edition], now).flatMap((group) => group.events)

  expect(events).toHaveLength(1)
  expect(events[0]?.date).toBe("2026-11-02")
  expect(events[0]?.label).toBe("학회 진행 중")
  expect(events[0]?.timeLabel).toBe("오늘 진행 중")
  expect(groupEditions([edition], now)[0]?.key).toBe("2026-11")
})

test("a start-day conference is in progress and an expired same-day deadline stays hidden", () => {
  const startDayEdition = {
    ...edition,
    conferenceStart: "2026-11-01",
    conferenceEnd: "2026-11-03",
    deadlines: [
      {
        id: "paper-start-day",
        label: "논문 제출",
        kind: "paper_submission",
        dueAtUtc: "2026-11-01T08:00:00Z",
        displayDate: "2026. 11. 1 17:00",
        timezone: "KST (UTC+9)",
        status: "confirmed",
        track: "Main track",
      },
    ],
  } satisfies Edition
  const now = new Date("2026-11-01T09:00:00Z")

  const events = calendarEventGroups([startDayEdition], now).flatMap((group) => group.events)

  expect(events).toHaveLength(1)
  expect(events[0]?.label).toBe("학회 진행 중")
  expect(events[0]?.timeLabel).toBe("오늘 진행 중")
})

test("an expired same-day deadline cannot anchor a future conference to today", () => {
  const now = new Date("2026-08-18T15:00:00Z")

  expect(groupEditions([edition], now)[0]?.key).toBe("2026-11")
})

test("all-field groups keep the field order and sort each field by its next schedule", () => {
  const now = new Date("2026-08-19T00:00:00Z")
  const [sourceDeadline] = edition.deadlines
  if (!sourceDeadline) throw new Error("field-group fixture requires one deadline")
  const circuitLater = {
    ...edition,
    id: "circuit-later",
    acronym: "CIRCUIT LATER",
    categories: ["Circuit"],
    deadlines: [
      {
        ...sourceDeadline,
        dueAtUtc: "2026-10-01T00:00:00Z",
        displayDate: "2026. 10. 1 09:00",
      },
    ],
  } satisfies Edition
  const circuitSooner = {
    ...circuitLater,
    id: "circuit-sooner",
    acronym: "CIRCUIT SOONER",
    deadlines: [
      {
        ...sourceDeadline,
        dueAtUtc: "2026-09-01T00:00:00Z",
        displayDate: "2026. 9. 1 09:00",
      },
    ],
  } satisfies Edition
  const systemSooner = {
    ...edition,
    id: "system-sooner",
    acronym: "SYSTEM SOONER",
    categories: ["System"],
    deadlines: [
      {
        ...sourceDeadline,
        dueAtUtc: "2026-08-25T00:00:00Z",
        displayDate: "2026. 8. 25 09:00",
      },
    ],
  } satisfies Edition

  const groups = groupEditionsByCategory([systemSooner, circuitLater, circuitSooner], now)

  expect(groups.map((group) => group.category)).toEqual(["Circuit", "System"])
  expect(groups[0]?.editions.map((item) => item.id)).toEqual(["circuit-sooner", "circuit-later"])
  expect(groups[1]?.editions.map((item) => item.id)).toEqual(["system-sooner"])
})

test("a still-open UTC deadline cannot reappear on a viewer-local past calendar day", () => {
  const aoeEdition = {
    ...edition,
    deadlines: [
      {
        id: "paper-aoe",
        label: "논문 제출",
        kind: "paper_submission",
        dueAtUtc: "2026-08-19T11:59:59Z",
        displayDate: "2026. 8. 18 23:59",
        timezone: "AoE (UTC-12)",
        status: "confirmed",
        track: "Main track",
      },
    ],
  } satisfies Edition
  const now = new Date("2026-08-19T00:00:00Z")

  const deadline = calendarEventGroups([aoeEdition], now)
    .flatMap((group) => group.events)
    .find((event) => event.type === "deadline")

  expect(deadline?.date).toBe("2026-08-19")
})

test("deadline countdown exposes readable urgency states", () => {
  const now = new Date("2026-08-19T00:00:00Z")
  const [deadline] = edition.deadlines
  if (!deadline) throw new Error("countdown fixture requires a deadline")
  const due = {
    ...deadline,
    dueAtUtc: "2026-08-22T00:00:00Z",
  } satisfies Edition["deadlines"][number]

  expect(deadlineCountdown(due, now)).toEqual({ label: "D-3", urgency: "danger" })
  expect(deadlineCountdown({ ...due, dueAtUtc: "2026-08-19T18:00:00Z" }, now)).toEqual({
    label: "TODAY",
    urgency: "danger",
  })
  expect(deadlineCountdown({ ...due, dueAtUtc: "2026-10-01T00:00:00Z" }, now)).toEqual({
    label: "D-43",
    urgency: "primary",
  })
  expect(deadlineCountdown({ ...due, dueAtUtc: "2026-08-18T23:59:59Z" }, now)).toEqual({
    label: "CLOSED",
    urgency: "closed",
  })
})
