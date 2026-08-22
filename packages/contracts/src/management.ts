import { z } from "zod"

export const fieldCategorySchema = z.enum(["AI", "System", "CV", "Circuit", "Archi"])

export const conferenceRequestInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  officialUrl: z.string().url(),
  category: fieldCategorySchema,
  note: z.string().trim().max(600),
})

export const scheduleOverrideInputSchema = z.object({
  editionId: z.string().trim().min(1).max(160),
  deadlineId: z.string().trim().min(1).max(160).nullable(),
  value: z.string().trim().min(2).max(240),
  evidenceUrl: z.string().url(),
  note: z.string().trim().max(600),
})

export type ConferenceRequestInput = z.infer<typeof conferenceRequestInputSchema>
export type FieldCategory = z.infer<typeof fieldCategorySchema>
export type ScheduleOverrideInput = z.infer<typeof scheduleOverrideInputSchema>
