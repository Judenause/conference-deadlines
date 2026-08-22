import { expect, test } from "bun:test"
import { catalogSchema } from "@conf/contracts"
import { auditFutureEditionSchedules, formatScheduleAuditReport } from "./schedule-audit"

const fixture = catalogSchema.parse({
  editions: [
    {
      id: "isca-2027",
      acronym: "ISCA 2027",
      name: "Fixture",
      year: 2027,
      location: "TBD",
      dateRange: "일정 미공개",
      conferenceStart: "2026-06-09",
      conferenceEnd: "2026-06-09",
      officialUrl: "https://iscaconf.org/",
      tier: null,
      categories: ["Archi"],
      status: "timezone-review-needed",
      description: "Fixture",
      registrySource: "curated",
      registrySourceUrl: "https://iscaconf.org/",
      registryRecordId: null,
      deadlines: [
        {
          id: "isca-2027-paper",
          label: "논문 제출",
          kind: "paper_submission",
          dueAtUtc: "2026-05-14T11:59:59Z",
          displayDate: "2026. 5. 13",
          timezone: "AoE (UTC-12)",
          status: "timezone-review-needed",
          track: "Main conference",
        },
      ],
    },
  ],
  evidence: [],
  history: [],
})

test("future editions with only elapsed copied dates are review findings", () => {
  const findings = auditFutureEditionSchedules(fixture, new Date("2026-08-21T00:00:00Z"))

  expect(findings).toEqual([
    {
      editionId: "isca-2027",
      acronym: "ISCA 2027",
      year: 2027,
      officialUrl: "https://iscaconf.org/",
      kind: "future-edition-has-only-past-schedule",
      staleDeadlineIds: ["isca-2027-paper"],
      staleConferenceDates: ["2026-06-09", "2026-06-09"],
    },
  ])
})

test("dates-pending editions are not repeatedly reported", () => {
  const catalog = catalogSchema.parse({
    ...fixture,
    editions: [
      {
        ...fixture.editions[0],
        status: "dates-pending",
        conferenceStart: null,
        conferenceEnd: null,
        deadlines: [],
      },
    ],
  })

  expect(auditFutureEditionSchedules(catalog, new Date("2026-08-21T00:00:00Z"))).toEqual([])
  expect(formatScheduleAuditReport([])).toContain("No stale future-edition schedules detected.")
})

test("the published catalog has no stale future-edition schedules", async () => {
  const catalog = catalogSchema.parse(
    await Bun.file(new URL("../../../data/seed/catalog-state.json", import.meta.url)).json(),
  )

  expect(auditFutureEditionSchedules(catalog, new Date("2026-08-21T00:00:00Z"))).toEqual([])
})
