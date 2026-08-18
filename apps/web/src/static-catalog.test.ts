import { expect, test } from "vitest"
import seed from "../../../data/seed/catalog-state.json"
import { getStaticBundle, parseStaticCatalog, StaticCatalogError } from "./static-catalog"

test("Given a generated catalog, when the static client opens an edition, then its evidence is scoped", () => {
  const catalog = parseStaticCatalog(seed)

  const bundle = getStaticBundle(catalog, "micro-2026")

  expect(bundle.edition.id).toBe("micro-2026")
  expect(bundle.evidence.every((item) => item.editionId === "micro-2026")).toBe(true)
  expect(bundle.history.every((item) => item.editionId === "micro-2026")).toBe(true)
})

test("Given a generated catalog, when an unknown edition opens, then a typed error is returned", () => {
  const catalog = parseStaticCatalog(seed)

  const openUnknownEdition = () => getStaticBundle(catalog, "missing-2026")

  expect(openUnknownEdition).toThrow(StaticCatalogError)
})

test("Given the lab timeline catalog, when it is parsed, then curation metadata remains typed", () => {
  const catalog = parseStaticCatalog(seed)
  const isscc = catalog.editions.find((edition) => edition.id === "isscc-2027")
  const remaining2026 = catalog.editions.filter((edition) => edition.year === 2026)

  expect(isscc?.categories).toContain("Circuit")
  expect(isscc?.tier).toBe("T1 (Non)")
  expect(remaining2026.map((edition) => edition.id)).toEqual(
    expect.arrayContaining([
      "icecs-2026",
      "emnlp-2026",
      "interspeech-2026",
      "micro-2026",
      "eccv-2026",
      "bmvc-2026",
    ]),
  )
  expect(catalog.editions.some((edition) => edition.categories.includes("HCI"))).toBe(false)
  expect(catalog.editions.some((edition) => edition.id === "cui-2026")).toBe(false)
  expect(catalog.editions.every((edition) => edition.officialUrl.startsWith("https://"))).toBe(true)
})
