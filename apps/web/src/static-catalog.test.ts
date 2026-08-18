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

test("Given the lab Notion registry, all 108 records and every official address remain auditable", () => {
  const catalog = parseStaticCatalog(seed)
  const notionEditions = catalog.editions.filter(
    (edition) => edition.registrySource === "lab-notion",
  )
  const categoryCounts = Object.fromEntries(
    ["Circuit", "AI", "System", "Archi", "CV"].map((category) => [
      category,
      notionEditions.filter((edition) => edition.categories.includes(category)).length,
    ]),
  )

  expect(notionEditions).toHaveLength(108)
  expect(categoryCounts).toEqual({ Circuit: 27, AI: 27, System: 30, Archi: 9, CV: 15 })
  expect(notionEditions.every((edition) => edition.registryRecordId)).toBe(true)
  expect(catalog.editions.every((edition) => edition.officialUrl.startsWith("https://"))).toBe(true)
})

test("Given a multi-stage conference, paper submission and conference dates stay separate", () => {
  const catalog = parseStaticCatalog(seed)
  const aaai = catalog.editions.find((edition) => edition.acronym === "AAAI 2027")

  expect(aaai?.deadlines.some((deadline) => deadline.kind === "paper_submission")).toBe(true)
  expect(aaai?.conferenceStart).toBe("2027-02-16")
  expect(aaai?.conferenceEnd).toBe("2027-02-23")
})
