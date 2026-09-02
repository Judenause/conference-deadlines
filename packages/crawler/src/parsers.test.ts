import { expect, test } from "bun:test"
import { parseOfficialHtml, parseOpenReviewVenue } from "./parsers"

test("official parser extracts explicit AoE and its locator", () => {
  const result = parseOfficialHtml(
    '<section id="important-dates"><p>Paper submission: 2026-03-16 23:59 AoE</p></section>',
  )
  expect(result[0]).toMatchObject({
    kind: "paper_submission",
    locator: "#important-dates",
    normalizedValue: "2026-03-17T11:59:59Z",
    state: "accepted",
  })
})

test("missing timezone is provisionally normalized as AoE and routed to timezone review", () => {
  const result = parseOfficialHtml("<p>Paper submission: 2026-03-16 23:59</p>")
  expect(result[0]).toMatchObject({
    normalizedValue: "2026-03-17T11:59:59Z",
    state: "timezone-review-needed",
  })
})

test("date-only deadlines use provisional AoE normalization for review", () => {
  const result = parseOfficialHtml("<p>Paper submission: March 16, 2026</p>")
  expect(result[0]).toMatchObject({
    state: "timezone-review-needed",
    normalizedValue: "2026-03-17T11:59:59Z",
    displayDate: "2026. 3. 16",
  })
})

test("month dates retain explicit clock text instead of guessing AoE", () => {
  const result = parseOfficialHtml(
    "<p>Full paper submission: April 7, 2026 at 11:59 PM EDT (Eastern Daylight Time)</p>",
  )
  expect(result[0]).toMatchObject({
    kind: "paper_submission",
    rawValue: "April 7, 2026 at 11:59 PM EDT (Eastern Daylight Time)",
    state: "review-needed",
  })
  expect(result[0]?.normalizedValue).toBeUndefined()
})

test("month dates with an explicit GMT clock are not downgraded to an AoE guess", () => {
  const result = parseOfficialHtml("<p>Paper registration: July 3, 2026, 23:59 GMT</p>")
  expect(result[0]).toMatchObject({
    kind: "paper_submission",
    rawValue: "July 3, 2026, 23:59 GMT",
    state: "review-needed",
  })
  expect(result[0]?.normalizedValue).toBeUndefined()
})

test("official parser extracts multiple labeled milestones from one date table", () => {
  const result = parseOfficialHtml(`
    <section id="important-dates">
      <p>Abstract registration: 2026-01-10 23:59 AoE</p>
      <p>Paper submission: 2026-01-17 23:59 AoE</p>
      <p>Notification: January 31, 2026</p>
    </section>
  `)
  expect(result.map((item) => item.kind)).toEqual([
    "abstract_registration",
    "paper_submission",
    "final_notification",
  ])
  expect(result[0]?.state).toBe("accepted")
  expect(result[2]?.state).toBe("timezone-review-needed")
})

test("official parser accepts ordinal month dates", () => {
  const result = parseOfficialHtml(`
    <div class="important-dates">
      <ul>
        <li>Full Paper Submission / Special Session Proposals: September 4th, 2026</li>
        <li>Notification of Acceptance: September 18th, 2026</li>
        <li>Submission of Final ver. Paper: September 30th, 2026</li>
      </ul>
    </div>
  `)

  expect(result.map((item) => item.kind)).toEqual([
    "paper_submission",
    "final_notification",
    "camera_ready",
  ])
  expect(result.map((item) => item.displayDate)).toEqual([
    "2026. 9. 4",
    "2026. 9. 18",
    "2026. 9. 30",
  ])
})

test("OpenReview uses duedate, not invitation expiration", () => {
  const result = parseOpenReviewVenue({ duedate: 1_774_699_199_000, expdate: 1_775_000_000_000 })
  expect(result).toMatchObject({ normalizedValue: "2026-03-28T11:59:59Z", state: "accepted" })
})
