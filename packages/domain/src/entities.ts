export type DeadlineStatus = "confirmed" | "extended" | "review-needed" | "timezone-review-needed"

export interface Deadline {
  readonly id: string
  readonly kind: string
  readonly label: string
  readonly dueAtUtc: string
  readonly sourceDateText: string
  readonly sourceTimezone: string
  readonly sourceObservationId: string
  readonly status: DeadlineStatus
}

export interface DeadlineChange {
  readonly deadlineId: string
  readonly before: string
  readonly after: string
  readonly beforeObservationId: string
  readonly afterObservationId: string
}
