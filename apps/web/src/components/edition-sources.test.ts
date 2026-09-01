import type { Edition } from "@conf/contracts"
import { expect, test } from "vitest"
import { editionSourceLinks } from "./edition-sources"

const edition = {
  id: "example-2027",
  acronym: "EXAMPLE 2027",
  name: "Example",
  year: 2027,
  location: "Online",
  dateRange: "일정 미공개",
  conferenceStart: null,
  conferenceEnd: null,
  officialUrl: "https://example.org/2027",
  additionalSourceUrls: ["https://example.org/2027/cfp", "https://example.org/2027/cfp"],
  tier: null,
  categories: ["AI"],
  status: "dates-pending",
  description: "fixture",
  registrySource: "curated",
  registrySourceUrl: "https://example.org/2027",
  registryRecordId: null,
  deadlines: [],
} satisfies Edition

test("edition source links keep the homepage and classify CFP pages", () => {
  expect(editionSourceLinks(edition)).toEqual([
    { label: "Official site", url: "https://example.org/2027" },
    { label: "CFP / important dates", url: "https://example.org/2027/cfp" },
  ])
})
