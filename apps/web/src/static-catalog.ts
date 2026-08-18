import {
  type Catalog,
  catalogSchema,
  type Edition,
  type Evidence,
  type History,
} from "@conf/contracts"

export type EditionBundle = {
  readonly edition: Edition
  readonly evidence: readonly Evidence[]
  readonly history: readonly History[]
}

export class StaticCatalogError extends Error {
  override readonly name = "StaticCatalogError"

  constructor(readonly editionId: string) {
    super(`정적 카탈로그에서 일정을 찾을 수 없습니다: ${editionId}`)
  }
}

export function parseStaticCatalog(input: unknown): Catalog {
  return catalogSchema.parse(input)
}

export function getStaticBundle(catalog: Catalog, editionId: string): EditionBundle {
  const edition = catalog.editions.find((item) => item.id === editionId)
  if (!edition) throw new StaticCatalogError(editionId)
  return {
    edition,
    evidence: catalog.evidence.filter((item) => item.editionId === editionId),
    history: catalog.history.filter((item) => item.editionId === editionId),
  }
}
