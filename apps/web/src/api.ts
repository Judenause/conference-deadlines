import {
  type Edition,
  type Evidence,
  editionSchema,
  evidenceSchema,
  type History,
  historySchema,
} from "@conf/contracts"
import { z } from "zod"

const editionListSchema = z.object({ items: z.array(editionSchema) })
const evidenceListSchema = z.object({ items: z.array(evidenceSchema) })
const historyListSchema = z.object({ items: z.array(historySchema) })

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(path)
  if (!response.ok) throw new Error("일정 데이터를 불러오지 못했습니다.")
  return response.json()
}

export async function getEditions(): Promise<readonly Edition[]> {
  return editionListSchema.parse(await getJson("/api/v1/editions")).items
}

export async function getEditionBundle(editionId: string): Promise<{
  readonly edition: Edition
  readonly evidence: readonly Evidence[]
  readonly history: readonly History[]
}> {
  const [edition, evidence, history] = await Promise.all([
    getJson(`/api/v1/editions/${editionId}`),
    getJson(`/api/v1/editions/${editionId}/evidence`),
    getJson(`/api/v1/editions/${editionId}/history`),
  ])
  return {
    edition: editionSchema.parse(edition),
    evidence: evidenceListSchema.parse(evidence).items,
    history: historyListSchema.parse(history).items,
  }
}
