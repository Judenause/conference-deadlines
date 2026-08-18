import { z } from "zod"

export const deadlineSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.string(),
  dueAtUtc: z.string(),
  displayDate: z.string(),
  timezone: z.string(),
  status: z.enum(["confirmed", "extended", "review-needed", "timezone-review-needed"]),
  track: z.string(),
})

export const editionSchema = z.object({
  id: z.string(),
  acronym: z.string(),
  name: z.string(),
  year: z.number().int(),
  location: z.string(),
  dateRange: z.string(),
  tier: z.string().nullable(),
  categories: z.array(z.string()),
  status: z.enum(["confirmed", "review-needed", "timezone-review-needed", "dates-pending"]),
  description: z.string(),
  deadlines: z.array(deadlineSchema),
})

export const evidenceSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  deadlineId: z.string(),
  sourceTitle: z.string(),
  sourceUrl: z.string().url(),
  checkedAt: z.string(),
  rawValue: z.string(),
  locator: z.string(),
  confidence: z.number().min(0).max(1),
})

export const historySchema = z.object({
  id: z.string(),
  editionId: z.string(),
  changedAt: z.string(),
  summary: z.string(),
  before: z.string(),
  after: z.string(),
  state: z.enum(["accepted", "pending", "rejected"]),
})

export const catalogSchema = z.object({
  editions: z.array(editionSchema),
  evidence: z.array(evidenceSchema),
  history: z.array(historySchema),
})

export const editionQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.string().trim().max(40).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

export type Catalog = z.infer<typeof catalogSchema>
export type Edition = z.infer<typeof editionSchema>
export type Evidence = z.infer<typeof evidenceSchema>
export type History = z.infer<typeof historySchema>
