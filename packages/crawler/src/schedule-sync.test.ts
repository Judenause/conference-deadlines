import { expect, test } from "bun:test"
import type { Catalog } from "@conf/contracts"
import { applyScheduleProposals, buildScheduleProposals } from "./schedule-sync"

const catalog: Catalog = {
  editions: [
    {
      id: "example-2027",
      acronym: "EXAMPLE 2027",
      name: "Example Conference",
      year: 2027,
      location: "Online",
      dateRange: "2027. 4. 1 - 4. 3",
      conferenceStart: "2027-04-01",
      conferenceEnd: "2027-04-03",
      officialUrl: "https://example.org/2027",
      tier: null,
      categories: ["AI"],
      status: "review-needed",
      description: "fixture",
      registrySource: "curated",
      registrySourceUrl: "https://example.org/registry",
      registryRecordId: null,
      deadlines: [
        {
          id: "example-2027-paper_submission",
          label: "논문 제출",
          kind: "paper_submission",
          dueAtUtc: "2027-01-01T11:59:59Z",
          displayDate: "2027. 1. 1",
          timezone: "AoE (UTC-12) · 시간대 가정",
          status: "timezone-review-needed",
          track: "Main conference",
        },
      ],
    },
  ],
  evidence: [],
  history: [],
}

test("schedule sync proposes an unambiguous changed deadline", () => {
  const proposals = buildScheduleProposals(catalog, [
    {
      editionId: "example-2027",
      sourceUrl: "https://example.org/2027",
      finalUrl: "https://example.org/2027/cfp",
      checkedAt: "2026-09-01T00:00:00Z",
      observations: [
        {
          kind: "paper_submission",
          rawValue: "2027-01-15 23:59 AoE",
          normalizedValue: "2027-01-16T11:59:59Z",
          displayDate: "2027. 1. 15",
          sourceTimezone: "AoE (-12:00)",
          locator: "#important-dates",
          confidence: 0.98,
          state: "accepted",
        },
      ],
    },
  ])
  expect(proposals).toHaveLength(1)
  expect(proposals[0]).toMatchObject({
    deadlineId: "example-2027-paper_submission",
    afterDueAtUtc: "2027-01-16T11:59:59Z",
    status: "confirmed",
  })
})

test("schedule sync does not guess when a milestone has multiple tracks", () => {
  const multiTrack = structuredClone(catalog)
  const edition = multiTrack.editions[0]
  if (!edition) throw new Error("fixture is incomplete")
  const firstDeadline = edition.deadlines[0]
  if (!firstDeadline) throw new Error("fixture deadline is incomplete")
  edition.deadlines.push({
    ...firstDeadline,
    id: "example-2027-paper_submission-track-b",
    track: "Workshop",
  })
  const proposals = buildScheduleProposals(multiTrack, [
    {
      editionId: "example-2027",
      sourceUrl: "https://example.org/2027",
      finalUrl: "https://example.org/2027",
      checkedAt: "2026-09-01T00:00:00Z",
      observations: [
        {
          kind: "paper_submission",
          rawValue: "2027-01-15 23:59 AoE",
          normalizedValue: "2027-01-16T11:59:59Z",
          displayDate: "2027. 1. 15",
          sourceTimezone: "AoE (-12:00)",
          locator: "#important-dates",
          confidence: 0.98,
          state: "accepted",
        },
      ],
    },
  ])
  expect(proposals).toHaveLength(0)
})

test("schedule sync withholds a deadline when official sources conflict", () => {
  const proposals = buildScheduleProposals(catalog, [
    {
      editionId: "example-2027",
      sourceUrl: "https://example.org/2027/dates",
      finalUrl: "https://example.org/2027/dates",
      checkedAt: "2026-09-01T00:00:00Z",
      observations: [
        {
          kind: "paper_submission",
          rawValue: "2027-01-15 23:59 AoE",
          normalizedValue: "2027-01-16T11:59:59Z",
          displayDate: "2027. 1. 15",
          sourceTimezone: "AoE (-12:00)",
          locator: "#important-dates",
          confidence: 0.98,
          state: "accepted",
        },
      ],
    },
    {
      editionId: "example-2027",
      sourceUrl: "https://example.org/2027/cfp",
      finalUrl: "https://example.org/2027/cfp",
      checkedAt: "2026-09-01T00:00:00Z",
      observations: [
        {
          kind: "paper_submission",
          rawValue: "2027-01-16 23:59 AoE",
          normalizedValue: "2027-01-17T11:59:59Z",
          displayDate: "2027. 1. 16",
          sourceTimezone: "AoE (-12:00)",
          locator: "#call-for-papers",
          confidence: 0.99,
          state: "accepted",
        },
      ],
    },
  ])

  expect(proposals).toHaveLength(0)
})

test("schedule sync ignores dates that are already past at check time", () => {
  const proposals = buildScheduleProposals(catalog, [
    {
      editionId: "example-2027",
      sourceUrl: "https://example.org/2027",
      finalUrl: "https://example.org/2027",
      checkedAt: "2027-02-01T00:00:00Z",
      observations: [
        {
          kind: "paper_submission",
          rawValue: "2027-01-15 23:59 AoE",
          normalizedValue: "2027-01-16T11:59:59Z",
          displayDate: "2027. 1. 15",
          sourceTimezone: "AoE (-12:00)",
          locator: "#important-dates",
          confidence: 0.98,
          state: "accepted",
        },
      ],
    },
  ])
  expect(proposals).toHaveLength(0)
})

test("schedule sync ignores a candidate after the conference starts", () => {
  const proposals = buildScheduleProposals(catalog, [
    {
      editionId: "example-2027",
      sourceUrl: "https://example.org/2027",
      finalUrl: "https://example.org/2027",
      checkedAt: "2026-09-01T00:00:00Z",
      observations: [
        {
          kind: "paper_submission",
          rawValue: "2027-04-02 23:59 AoE",
          normalizedValue: "2027-04-03T11:59:59Z",
          displayDate: "2027. 4. 2",
          sourceTimezone: "AoE (-12:00)",
          locator: "#important-dates",
          confidence: 0.98,
          state: "accepted",
        },
      ],
    },
  ])
  expect(proposals).toHaveLength(0)
})

test("schedule sync ignores timezone-only changes on the same calendar date", () => {
  const proposals = buildScheduleProposals(catalog, [
    {
      editionId: "example-2027",
      sourceUrl: "https://example.org/2027",
      finalUrl: "https://example.org/2027",
      checkedAt: "2026-09-01T00:00:00Z",
      observations: [
        {
          kind: "paper_submission",
          rawValue: "2027-01-01 23:59 AoE",
          normalizedValue: "2027-01-02T11:59:59Z",
          displayDate: "2027. 1. 1",
          sourceTimezone: "AoE (-12:00)",
          locator: "#important-dates",
          confidence: 0.98,
          state: "accepted",
        },
      ],
    },
  ])
  expect(proposals).toHaveLength(0)
})

test("applying proposals updates the deadline and preserves source evidence", () => {
  const proposal = buildScheduleProposals(catalog, [
    {
      editionId: "example-2027",
      sourceUrl: "https://example.org/2027",
      finalUrl: "https://example.org/2027",
      checkedAt: "2026-09-01T00:00:00Z",
      observations: [
        {
          kind: "paper_submission",
          rawValue: "2027-01-15 23:59 AoE",
          normalizedValue: "2027-01-16T11:59:59Z",
          displayDate: "2027. 1. 15",
          sourceTimezone: "AoE (-12:00)",
          locator: "#important-dates",
          confidence: 0.98,
          state: "accepted",
        },
      ],
    },
  ])
  const next = applyScheduleProposals(catalog, proposal)
  expect(next.editions[0]?.deadlines[0]?.dueAtUtc).toBe("2027-01-16T11:59:59Z")
  expect(next.evidence[0]).toMatchObject({ sourceUrl: "https://example.org/2027" })
  expect(next.history[0]).toMatchObject({ state: "pending" })
})
