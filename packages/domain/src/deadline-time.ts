export type ParsedDeadline =
  | {
      readonly kind: "normalized"
      readonly dueAtUtc: string
      readonly sourceDateText: string
      readonly sourceTimezone: string
    }
  | { readonly kind: "review-needed"; readonly sourceDateText: string; readonly reason: string }

const explicitAoe = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})\s+AoE$/i

export function parseSourceDeadline(sourceDateText: string): ParsedDeadline {
  const match = explicitAoe.exec(sourceDateText.trim())
  if (!match) {
    return {
      kind: "review-needed",
      sourceDateText,
      reason: "연도, 시간, 시간대가 모두 명시되어야 합니다.",
    }
  }

  const [, year, month, day, hour, minute] = match
  const localAsUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    59,
  )
  const dueAtUtc = new Date(localAsUtc + 12 * 60 * 60 * 1000).toISOString().replace(".000Z", "Z")
  return {
    kind: "normalized",
    dueAtUtc,
    sourceDateText,
    sourceTimezone: "AoE (-12:00)",
  }
}
