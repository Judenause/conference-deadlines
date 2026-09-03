import { type ConferenceRequestInput, conferenceRequestInputSchema } from "@conf/contracts"
import ky from "ky"
import { z } from "zod"

const managementResponseSchema = z.object({
  items: z.array(
    conferenceRequestInputSchema.extend({
      id: z.string().uuid(),
      status: z.literal("approved"),
      submittedAt: z.string().datetime(),
    }),
  ),
})

export interface ConferenceRequestRecord extends ConferenceRequestInput {
  readonly id: string
  readonly status: "approved"
  readonly submittedAt: string
}

export async function readManagementConferenceRequests(
  apiUrl: string,
  syncToken: string,
): Promise<readonly ConferenceRequestRecord[]> {
  const endpoint = new URL("/api/v1/internal/conference-requests", apiUrl)
  const response = managementResponseSchema.parse(
    await ky
      .get(endpoint, {
        headers: { authorization: `Bearer ${syncToken}` },
        retry: { limit: 2 },
        timeout: 15_000,
      })
      .json<unknown>(),
  )
  return response.items.sort((left, right) => left.id.localeCompare(right.id))
}
