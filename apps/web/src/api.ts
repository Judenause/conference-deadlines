import {
  type Edition,
  type Evidence,
  editionSchema,
  evidenceSchema,
  type History,
  historySchema,
} from "@conf/contracts"
import { z } from "zod"
import { getStaticBundle, parseStaticCatalog } from "./static-catalog"

const editionListSchema = z.object({ items: z.array(editionSchema) })
const evidenceListSchema = z.object({ items: z.array(evidenceSchema) })
const historyListSchema = z.object({ items: z.array(historySchema) })
const catalogMetaSchema = z.object({ lastCheckedAt: z.string().nullable() })
const staticDataEnabled = import.meta.env.VITE_STATIC_DATA === "true"
let staticCatalogRequest: ReturnType<typeof loadStaticCatalog> | undefined

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(path)
  if (!response.ok) throw new Error("일정 데이터를 불러오지 못했습니다.")
  return response.json()
}

async function loadStaticCatalog() {
  return parseStaticCatalog(await getJson(`${import.meta.env.BASE_URL}catalog-state.json`))
}

function getStaticCatalog() {
  staticCatalogRequest ??= loadStaticCatalog()
  return staticCatalogRequest
}

export async function getEditions(): Promise<readonly Edition[]> {
  if (staticDataEnabled) return (await getStaticCatalog()).editions
  return editionListSchema.parse(await getJson("/api/v1/editions?limit=250")).items
}

export async function getCatalogLastUpdated(): Promise<string | undefined> {
  if (staticDataEnabled) {
    const evidence = (await getStaticCatalog()).evidence
    return evidence.reduce<string | undefined>(
      (latest, item) => (!latest || item.checkedAt > latest ? item.checkedAt : latest),
      undefined,
    )
  }
  const meta = catalogMetaSchema.parse(await getJson("/api/v1/catalog/meta"))
  return meta.lastCheckedAt ?? undefined
}

export async function getEditionBundle(editionId: string): Promise<{
  readonly edition: Edition
  readonly evidence: readonly Evidence[]
  readonly history: readonly History[]
}> {
  if (staticDataEnabled) return getStaticBundle(await getStaticCatalog(), editionId)
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
