import { parseSourceDeadline } from "@conf/domain"
import { load } from "cheerio"

export interface ParsedObservation {
  readonly kind:
    | "abstract_registration"
    | "paper_submission"
    | "supplementary_submission"
    | "first_notification"
    | "rebuttal"
    | "final_notification"
    | "camera_ready"
    | "workshop_submission"
  readonly rawValue: string
  readonly normalizedValue?: string
  readonly displayDate?: string
  readonly sourceTimezone?: string
  readonly locator: string
  readonly confidence: number
  readonly state: "accepted" | "review-needed" | "timezone-review-needed"
}

const datePattern =
  /(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:AoE|UTC[-+]\d{1,2}|UTC|GMT|EDT|EST|CDT|CST|MDT|MST|PDT|PST))?)?|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?,\s+\d{4}(?:\s*(?:(?:,|at)\s*)?\d{1,2}:\d{2}(?:\s*(?:AM|PM))?(?:\s*(?:AoE|UTC[-+]\d{1,2}|UTC|GMT|EDT|EST|CDT|CST|MDT|MST|PDT|PST))?(?:\s*\([^)]*\))?)?)/i

const kindPatterns = [
  { kind: "abstract_registration" as const, pattern: /abstract|초록/i },
  { kind: "supplementary_submission" as const, pattern: /supplementary|supp\.?\s*material|보충/i },
  {
    kind: "camera_ready" as const,
    pattern: /camera[-\s]?ready|final\s+(?:(?:ver(?:sion)?\.?\s+)?paper|version)|최종본/i,
  },
  { kind: "rebuttal" as const, pattern: /rebuttal|반박/i },
  { kind: "workshop_submission" as const, pattern: /workshop|워크숍/i },
  {
    kind: "first_notification" as const,
    pattern: /first\s+(?:notification|decision)|1st\s+(?:notification|decision)/i,
  },
  { kind: "final_notification" as const, pattern: /notification|decision|acceptance|결과|통보/i },
  { kind: "paper_submission" as const, pattern: /paper|full\s+paper|submission|논문/i },
] as const

const monthNumbers: Readonly<Record<string, string>> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
}

function classifyKind(value: string): ParsedObservation["kind"] | undefined {
  return kindPatterns.find(({ pattern }) => pattern.test(value))?.kind
}

function normalizeDateToken(
  value: string,
): { readonly source: string; readonly displayDate: string } | undefined {
  const trimmed = value.trim().replace(/[.)]+$/, "")
  const iso =
    /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?:\s*(AoE|UTC[-+]\d{1,2}|UTC|GMT|EDT|EST|CDT|CST|MDT|MST|PDT|PST))?)?$/i.exec(
      trimmed,
    )
  if (iso?.[1] && iso[2] && iso[3]) {
    const month = iso[2].padStart(2, "0")
    const day = iso[3].padStart(2, "0")
    const time =
      iso[4] && iso[5]
        ? ` ${iso[4].padStart(2, "0")}:${iso[5]}${iso[6] ? ` ${iso[6]}` : ""}`
        : " 23:59"
    return {
      source: `${iso[1]}-${month}-${day}${time}`,
      displayDate: `${iso[1]}. ${Number(month)}. ${Number(day)}`,
    }
  }
  const monthDate =
    /^(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?,\s+(\d{4})(.*)$/i.exec(
      trimmed,
    )
  if (monthDate?.[1] && monthDate[2] && monthDate[3]) {
    const month = monthNumbers[monthDate[1].toLowerCase()]
    if (!month) return undefined
    const day = monthDate[2].padStart(2, "0")
    const suffix = monthDate[4]?.trim().replace(/\s*\([^)]*\)\s*$/, "") ?? ""
    const timeMatch = /^(?:,|at)?\s*(\d{1,2}):(\d{2})(?:\s*(AM|PM))?(?:\s+(.+))?$/i.exec(suffix)
    if (suffix && !timeMatch) return undefined
    const hour = timeMatch?.[1] ? Number(timeMatch[1]) : 23
    const minute = timeMatch?.[2] ? Number(timeMatch[2]) : 59
    const meridiem = timeMatch?.[3]?.toUpperCase()
    const normalizedHour =
      meridiem === "AM"
        ? hour === 12
          ? 0
          : hour
        : meridiem === "PM"
          ? hour === 12
            ? 12
            : hour + 12
          : hour
    const time = `${String(normalizedHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    const timezone = timeMatch?.[4]?.trim()
    return {
      source: `${monthDate[3]}-${month}-${day} ${time}${timezone ? ` ${timezone}` : ""}`,
      displayDate: `${monthDate[3]}. ${Number(month)}. ${Number(day)}${timeMatch ? ` ${time}` : ""}`,
    }
  }
  return undefined
}

function parseRow(value: string, locator: string): ParsedObservation | undefined {
  const kind = classifyKind(value)
  const match = datePattern.exec(value)
  if (!kind || !match?.[0]) return undefined
  const normalized = normalizeDateToken(match[0])
  if (!normalized) return undefined
  const parsed = parseSourceDeadline(normalized.source)
  switch (parsed.kind) {
    case "normalized":
      return {
        kind,
        rawValue: match[0],
        normalizedValue: parsed.dueAtUtc,
        displayDate: normalized.displayDate,
        sourceTimezone: parsed.sourceTimezone,
        locator,
        confidence: 0.98,
        state: "accepted",
      }
    case "timezone-review-needed":
      return {
        kind,
        rawValue: match[0],
        normalizedValue: parsed.dueAtUtc,
        displayDate: normalized.displayDate,
        sourceTimezone: parsed.sourceTimezone,
        locator,
        confidence: 0.72,
        state: "timezone-review-needed",
      }
    case "review-needed":
      return { kind, rawValue: match[0], locator, confidence: 0, state: "review-needed" }
  }
}

export function parseOfficialHtml(html: string): readonly ParsedObservation[] {
  const $ = load(html)
  const scope = $("#important-dates").length > 0 ? $("#important-dates") : $("body")
  const rows = scope.find("tr, li, p").toArray()
  const candidates =
    rows.length > 0
      ? rows.map((element) =>
          parseRow(
            $(element).text().replace(/\s+/g, " ").trim(),
            $(element).is("tr") ? "#important-dates tr" : "#important-dates",
          ),
        )
      : [
          parseRow(
            scope.text().replace(/\s+/g, " ").trim(),
            $("#important-dates").length > 0 ? "#important-dates" : "body",
          ),
        ]
  return candidates.filter((candidate): candidate is ParsedObservation => candidate !== undefined)
}

export function parseOpenReviewVenue(value: {
  readonly duedate?: number
  readonly expdate?: number
}): ParsedObservation {
  if (value.duedate === undefined) {
    return {
      kind: "paper_submission",
      rawValue: "duedate missing",
      locator: "$.duedate",
      confidence: 0,
      state: "review-needed",
    }
  }
  const normalizedValue = new Date(value.duedate).toISOString().replace(".000Z", "Z")
  return {
    kind: "paper_submission",
    rawValue: String(value.duedate),
    normalizedValue,
    locator: "$.duedate",
    confidence: 1,
    state: "accepted",
  }
}
