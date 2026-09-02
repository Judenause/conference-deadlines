import type { ConferenceRequestInput } from "@conf/contracts"
import { conferenceRequestInputSchema } from "@conf/contracts"
import ky from "ky"
import { z } from "zod"

const firestoreValueSchema = z.object({
  stringValue: z.string().optional(),
  timestampValue: z.string().optional(),
  booleanValue: z.boolean().optional(),
})

const firestoreDocumentSchema = z.object({
  name: z.string().min(1),
  fields: z.record(z.string(), firestoreValueSchema).default({}),
})

const firestoreListResponseSchema = z.object({
  documents: z.array(firestoreDocumentSchema).default([]),
  nextPageToken: z.string().optional(),
})

export interface ConferenceRequestRecord extends ConferenceRequestInput {
  readonly id: string
  readonly status: string
  readonly submittedAt: string | undefined
}

export interface ConferenceRequestReadResult {
  readonly requests: readonly ConferenceRequestRecord[]
  readonly invalidIds: readonly string[]
}

export interface FirestoreRequestConfig {
  readonly projectId: string
  readonly accessToken: string
}

function fieldString(
  fields: Readonly<Record<string, z.infer<typeof firestoreValueSchema>>>,
  key: string,
): string | undefined {
  const field = fields[key]
  return field?.stringValue ?? field?.timestampValue
}

function documentId(name: string): string | undefined {
  const id = name.split("/").at(-1)
  return id?.trim() ? id : undefined
}

function parseRequest(
  document: z.infer<typeof firestoreDocumentSchema>,
): ConferenceRequestRecord | undefined {
  const id = documentId(document.name)
  const status = fieldString(document.fields, "status")
  const input = conferenceRequestInputSchema.safeParse({
    name: fieldString(document.fields, "name"),
    officialUrl: fieldString(document.fields, "officialUrl"),
    category: fieldString(document.fields, "category"),
    note: fieldString(document.fields, "note") ?? "",
  })
  if (!id || !status || !input.success) return undefined
  return {
    id,
    ...input.data,
    status,
    submittedAt: fieldString(document.fields, "submittedAt"),
  }
}

export async function readConferenceRequests(
  config: FirestoreRequestConfig,
): Promise<ConferenceRequestReadResult> {
  const requests: ConferenceRequestRecord[] = []
  const invalidIds: string[] = []
  const seenTokens = new Set<string>()
  let pageToken: string | undefined

  for (let page = 0; page < 100; page += 1) {
    const endpoint = new URL(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/(default)/documents/conferenceRequests`,
    )
    endpoint.searchParams.set("pageSize", "100")
    if (pageToken) endpoint.searchParams.set("pageToken", pageToken)
    const response = firestoreListResponseSchema.parse(
      await ky
        .get(endpoint, {
          headers: { authorization: `Bearer ${config.accessToken}` },
          retry: { limit: 2 },
          timeout: 15_000,
        })
        .json<unknown>(),
    )
    for (const document of response.documents) {
      const request = parseRequest(document)
      if (request) requests.push(request)
      else {
        const id = documentId(document.name)
        if (id) invalidIds.push(id)
      }
    }
    if (!response.nextPageToken) break
    if (seenTokens.has(response.nextPageToken))
      throw new Error("Firestore 페이지 토큰이 반복되었습니다.")
    seenTokens.add(response.nextPageToken)
    pageToken = response.nextPageToken
  }

  return {
    requests: [...requests].sort((left, right) => left.id.localeCompare(right.id)),
    invalidIds: [...new Set(invalidIds)].sort(),
  }
}
