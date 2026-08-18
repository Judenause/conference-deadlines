import { parseSourceDeadline } from "@conf/domain"
import { load } from "cheerio"

export interface ParsedObservation {
  readonly kind: "paper_submission"
  readonly rawValue: string
  readonly normalizedValue?: string
  readonly locator: string
  readonly confidence: number
  readonly state: "accepted" | "review-needed" | "timezone-review-needed"
}

export function parseOfficialHtml(html: string): readonly ParsedObservation[] {
  const $ = load(html)
  const scope = $("#important-dates").length > 0 ? $("#important-dates") : $("body")
  const text = scope.text().replace(/\s+/g, " ").trim()
  const match =
    /Paper submission:\s*((?:\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}\s+AoE)|(?:\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})|(?:[A-Za-z]+\s+\d{1,2},\s+\d{4}))/i.exec(
      text,
    )
  if (!match?.[1]) return []

  const rawValue = match[1]
  const parsed = parseSourceDeadline(rawValue)
  const locator = $("#important-dates").length > 0 ? "#important-dates" : "body"
  switch (parsed.kind) {
    case "review-needed":
      return [
        {
          kind: "paper_submission",
          rawValue,
          locator,
          confidence: 0.72,
          state: "review-needed",
        },
      ]
    case "timezone-review-needed":
      return [
        {
          kind: "paper_submission",
          rawValue,
          normalizedValue: parsed.dueAtUtc,
          locator,
          confidence: 0.72,
          state: "timezone-review-needed",
        },
      ]
    case "normalized":
      return [
        {
          kind: "paper_submission",
          rawValue,
          normalizedValue: parsed.dueAtUtc,
          locator,
          confidence: 0.98,
          state: "accepted",
        },
      ]
  }
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
