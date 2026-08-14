import { type Catalog, catalogSchema, type Edition } from "@conf/contracts"
import seed from "../../../data/seed/catalog-state.json"

const catalog = catalogSchema.parse(seed)

export function getCatalog(): Catalog {
  return catalog
}

export function findEdition(editionId: string): Edition | undefined {
  return catalog.editions.find((edition) => edition.id === editionId)
}
