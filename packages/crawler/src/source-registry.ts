export interface RegisteredSource {
  readonly id: string
  readonly canonicalUrl: string
  readonly allowedHosts: readonly string[]
  readonly adapter: "official-html"
}

const sources: Readonly<Record<string, RegisteredSource>> = {
  "cui-2026-official": {
    id: "cui-2026-official",
    canonicalUrl: "https://cui.acm.org/2026/submission/",
    allowedHosts: ["cui.acm.org"],
    adapter: "official-html",
  },
}

export function resolveRegisteredSource(sourceId: string): RegisteredSource {
  const source = sources[sourceId]
  if (!source) throw new Error(`등록되지 않은 소스: ${sourceId}`)
  const url = new URL(source.canonicalUrl)
  if (url.protocol !== "https:" || !source.allowedHosts.includes(url.hostname)) {
    throw new Error(`안전하지 않은 소스 설정: ${sourceId}`)
  }
  return source
}
