export type ParsedDeadline =
  | {
      readonly kind: "normalized"
      readonly dueAtUtc: string
      readonly sourceDateText: string
      readonly sourceTimezone: string
    }
  | {
      readonly kind: "timezone-review-needed"
      readonly dueAtUtc: string
      readonly sourceDateText: string
      readonly sourceTimezone: string
      readonly reason: string
    }
  | { readonly kind: "review-needed"; readonly sourceDateText: string; readonly reason: string }

const explicitAoe = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})\s+AoE$/i
const missingTimezone = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/

function toAoeUtc(match: RegExpExecArray): string {
  const [, year, month, day, hour, minute] = match
  const localAsUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    59,
  )
  return new Date(localAsUtc + 12 * 60 * 60 * 1000).toISOString().replace(".000Z", "Z")
}

export function parseSourceDeadline(sourceDateText: string): ParsedDeadline {
  const trimmed = sourceDateText.trim()
  const explicitMatch = explicitAoe.exec(trimmed)
  if (explicitMatch) {
    return {
      kind: "normalized",
      dueAtUtc: toAoeUtc(explicitMatch),
      sourceDateText,
      sourceTimezone: "AoE (-12:00)",
    }
  }

  const assumedMatch = missingTimezone.exec(trimmed)
  if (assumedMatch) {
    return {
      kind: "timezone-review-needed",
      dueAtUtc: toAoeUtc(assumedMatch),
      sourceDateText,
      sourceTimezone: "AoE (-12:00, assumed)",
      reason: "원문에 시간대가 없어 AoE로 임시 계산했습니다.",
    }
  }

  return {
    kind: "review-needed",
    sourceDateText,
    reason: "연도와 시간이 명시되어야 합니다.",
  }
}
