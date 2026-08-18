import { expect, test } from "bun:test"
import { parseSourceDeadline } from "./deadline-time"

test("explicit AoE retains provenance and becomes an exact UTC instant", () => {
  expect(parseSourceDeadline("2026-03-16 23:59 AoE")).toEqual({
    kind: "normalized",
    dueAtUtc: "2026-03-17T11:59:59Z",
    sourceDateText: "2026-03-16 23:59 AoE",
    sourceTimezone: "AoE (-12:00)",
  })
})

test("missing timezone uses AoE provisionally and remains reviewable", () => {
  expect(parseSourceDeadline("2026-03-16 23:59")).toEqual({
    kind: "timezone-review-needed",
    dueAtUtc: "2026-03-17T11:59:59Z",
    sourceDateText: "2026-03-16 23:59",
    sourceTimezone: "AoE (-12:00, assumed)",
    reason: "원문에 시간대가 없어 AoE로 임시 계산했습니다.",
  })
})

test.each(["2026-03-16", "midnight", "March 16, 23:59"])(
  "ambiguous deadline %s requires review",
  (value) => expect(parseSourceDeadline(value).kind).toBe("review-needed"),
)
