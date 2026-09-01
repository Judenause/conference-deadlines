import { expect, test } from "bun:test"
import { catalogSchema } from "@conf/contracts"
import { compareSourceStates, createSourceState, monitorSources } from "./source-monitor"

test("source monitor registers every catalog edition as an official URL check", async () => {
  // Given: the published catalog that powers the public site.
  const catalog = catalogSchema.parse(
    await Bun.file(new URL("../../../data/seed/catalog-state.json", import.meta.url)).json(),
  )

  // When: the monthly monitor derives its registered sources.
  const sources = monitorSources(catalog)

  // Then: every edition has a primary check, and ISCA also has its CFP source check.
  expect(sources).toHaveLength(catalog.editions.length + 1)
  expect(new Set(sources.map((source) => source.id)).size).toBe(catalog.editions.length + 1)
  expect(sources.every((source) => new URL(source.canonicalUrl).protocol === "https:")).toBe(true)
  expect(sources).toContainEqual({
    id: "isca-2026:additional-1",
    editionId: "isca-2026",
    name: "ISCA 2026",
    canonicalUrl: "https://iscaconf.org/isca2026/submit/callforpapers.php",
  })
})

test("source monitor reports a changed official URL fingerprint", () => {
  // Given: a previously reachable official source.
  const previous = createSourceState([
    {
      id: "cvpr-2027",
      canonicalUrl: "https://cvpr.thecvf.com/",
      finalUrl: "https://cvpr.thecvf.com/",
      kind: "available",
      sha256: "first-hash",
    },
  ])

  // When: the source content changes without moving.
  const next = createSourceState([
    {
      id: "cvpr-2027",
      canonicalUrl: "https://cvpr.thecvf.com/",
      finalUrl: "https://cvpr.thecvf.com/",
      kind: "available",
      sha256: "second-hash",
    },
  ])
  const previousCheck = previous.sources["cvpr-2027"]
  const nextCheck = next.sources["cvpr-2027"]
  if (!previousCheck || !nextCheck) throw new Error("source state fixture is incomplete")

  // Then: review receives the content change with the official URL.
  expect(compareSourceStates(previous, next)).toEqual([
    {
      id: "cvpr-2027",
      kind: "content-changed",
      canonicalUrl: "https://cvpr.thecvf.com/",
      previous: previousCheck,
      next: nextCheck,
    },
  ])
})

test("source monitor reports a cross-host redirect for review", () => {
  // Given: the source was previously hosted on its registered domain.
  const previous = createSourceState([
    {
      id: "cvpr-2027",
      canonicalUrl: "https://cvpr.thecvf.com/",
      finalUrl: "https://cvpr.thecvf.com/",
      kind: "available",
      sha256: "same-hash",
    },
  ])

  // When: a later check observes a different final URL.
  const next = createSourceState([
    {
      id: "cvpr-2027",
      canonicalUrl: "https://cvpr.thecvf.com/",
      finalUrl: "https://cvpr2027.example.org/",
      kind: "available",
      sha256: "same-hash",
    },
  ])
  const previousCheck = previous.sources["cvpr-2027"]
  const nextCheck = next.sources["cvpr-2027"]
  if (!previousCheck || !nextCheck) throw new Error("source state fixture is incomplete")

  // Then: review receives an URL-moved event instead of an automatic replacement.
  expect(compareSourceStates(previous, next)).toEqual([
    {
      id: "cvpr-2027",
      kind: "url-moved",
      canonicalUrl: "https://cvpr.thecvf.com/",
      previous: previousCheck,
      next: nextCheck,
    },
  ])
})
