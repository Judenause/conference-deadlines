import { expect, test } from "bun:test"
import { crawlFixture } from "./crawl"
import { isPrivateAddress } from "./safe-fetch"

test("fixture crawl produces a provenanced accepted observation", async () => {
  const result = await crawlFixture("cui-2026-official")
  expect(result).toMatchObject({
    sourceId: "cui-2026-official",
    mode: "fixture",
    observations: [{ state: "accepted", normalizedValue: "2026-03-17T11:59:59Z" }],
  })
  expect(result.sha256).toHaveLength(64)
})

test.each(["127.0.0.1", "10.1.2.3", "192.168.1.2", "169.254.2.2", "::1", "fd00::1"])(
  "private destination %s is blocked",
  (address) => expect(isPrivateAddress(address)).toBe(true),
)
