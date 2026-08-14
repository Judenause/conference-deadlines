import type { Deadline, DeadlineChange } from "./entities"

function canonicalize(deadlines: readonly Deadline[]): string {
  return JSON.stringify([...deadlines].sort((left, right) => left.id.localeCompare(right.id)))
}

export async function stableContentHash(deadlines: readonly Deadline[]): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalize(deadlines))
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export function diffDeadlines(
  previous: readonly Deadline[],
  next: readonly Deadline[],
): readonly DeadlineChange[] {
  const previousById = new Map(previous.map((deadline) => [deadline.id, deadline]))
  return next.flatMap((deadline) => {
    const before = previousById.get(deadline.id)
    if (!before || before.dueAtUtc === deadline.dueAtUtc) return []
    return [
      {
        deadlineId: deadline.id,
        before: before.dueAtUtc,
        after: deadline.dueAtUtc,
        beforeObservationId: before.sourceObservationId,
        afterObservationId: deadline.sourceObservationId,
      },
    ]
  })
}
