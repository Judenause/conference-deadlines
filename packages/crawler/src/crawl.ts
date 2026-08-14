import { type ParsedObservation, parseOfficialHtml } from "./parsers"
import { fetchRegisteredHtml } from "./safe-fetch"
import { resolveRegisteredSource } from "./source-registry"

export interface CrawlResult {
  readonly sourceId: string
  readonly mode: "fixture" | "live"
  readonly requestedUrl: string
  readonly finalUrl: string
  readonly checkedAt: string
  readonly sha256: string
  readonly observations: readonly ParsedObservation[]
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function createResult(
  sourceId: string,
  body: string,
  finalUrl: string,
  mode: "fixture" | "live",
  checkedAt: string,
): Promise<CrawlResult> {
  const source = resolveRegisteredSource(sourceId)
  return sha256(body).then((hash) => ({
    sourceId,
    mode,
    requestedUrl: source.canonicalUrl,
    finalUrl,
    checkedAt,
    sha256: hash,
    observations: parseOfficialHtml(body),
  }))
}

export async function crawlFixture(sourceId: string): Promise<CrawlResult> {
  const source = resolveRegisteredSource(sourceId)
  const fixture = Bun.file(new URL("../../../fixtures/raw/cui-2026-official.html", import.meta.url))
  return createResult(
    sourceId,
    await fixture.text(),
    source.canonicalUrl,
    "fixture",
    "2026-08-14T01:00:00Z",
  )
}

export async function crawlLive(sourceId: string): Promise<CrawlResult> {
  const source = resolveRegisteredSource(sourceId)
  const fetched = await fetchRegisteredHtml(source)
  return createResult(sourceId, fetched.body, fetched.finalUrl, "live", new Date().toISOString())
}
