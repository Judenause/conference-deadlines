import { expect, test } from "vitest"
import seed from "../../../data/seed/catalog-state.json"
import { getStaticBundle, parseStaticCatalog, StaticCatalogError } from "./static-catalog"

test("Given a generated catalog, when the static client opens an edition, then its evidence is scoped", () => {
  const catalog = parseStaticCatalog(seed)

  const bundle = getStaticBundle(catalog, "cui-2026")

  expect(bundle.edition.id).toBe("cui-2026")
  expect(bundle.evidence.every((item) => item.editionId === "cui-2026")).toBe(true)
  expect(bundle.history.every((item) => item.editionId === "cui-2026")).toBe(true)
})

test("Given a generated catalog, when an unknown edition opens, then a typed error is returned", () => {
  const catalog = parseStaticCatalog(seed)

  const openUnknownEdition = () => getStaticBundle(catalog, "missing-2026")

  expect(openUnknownEdition).toThrow(StaticCatalogError)
})
