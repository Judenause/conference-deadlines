import { expect, test } from "bun:test"
import { diffDeadlines, stableContentHash } from "./diff"
import type { Deadline } from "./entities"

const first: Deadline = {
  id: "deadline-paper",
  kind: "paper_submission",
  label: "논문 제출",
  dueAtUtc: "2026-03-17T11:59:59Z",
  sourceDateText: "March 16, 2026 23:59 AoE",
  sourceTimezone: "AoE (-12:00)",
  sourceObservationId: "observation-1",
  status: "confirmed",
}

test("stable hash ignores deadline ordering", async () => {
  const second = { ...first, id: "deadline-abstract", label: "초록 등록" }
  expect(await stableContentHash([first, second])).toBe(await stableContentHash([second, first]))
})

test("semantic diff carries both observation IDs", () => {
  const next = {
    ...first,
    dueAtUtc: "2026-03-24T11:59:59Z",
    sourceObservationId: "observation-2",
  }
  expect(diffDeadlines([first], [next])).toEqual([
    {
      deadlineId: "deadline-paper",
      before: first.dueAtUtc,
      after: next.dueAtUtc,
      beforeObservationId: "observation-1",
      afterObservationId: "observation-2",
    },
  ])
})
