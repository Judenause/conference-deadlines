import { lookup } from "node:dns/promises"
import robotsParser from "robots-parser"
import type { RegisteredSource } from "./source-registry"

const userAgent = "DeadlineObservatory/0.1 (+https://localhost/about-crawler)"
const maxBytes = 2 * 1024 * 1024
const timeoutMs = 10_000
const lastRequestByHost = new Map<string, number>()

export function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase()
  if (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80")
  )
    return true
  const parts = normalized.split(".").map(Number)
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false
  const [first, second] = parts
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second !== undefined && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  )
}

async function assertPublicHost(url: URL, source: RegisteredSource): Promise<void> {
  if (url.protocol !== "https:" || !source.allowedHosts.includes(url.hostname))
    throw new Error("허용되지 않은 리디렉션 대상입니다.")
  const addresses = await lookup(url.hostname, { all: true })
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address)))
    throw new Error("공개 네트워크 주소가 아닌 대상은 차단됩니다.")
}

async function rateLimit(host: string): Promise<void> {
  const elapsed = Date.now() - (lastRequestByHost.get(host) ?? 0)
  if (elapsed < 1_000) await Bun.sleep(1_000 - elapsed)
  lastRequestByHost.set(host, Date.now())
}

async function boundedFetch(url: URL, source: RegisteredSource): Promise<Response> {
  let current = url
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    await assertPublicHost(current, source)
    await rateLimit(current.hostname)
    const response = await fetch(current, {
      headers: { "user-agent": userAgent, accept: "text/html,application/json" },
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (response.status < 300 || response.status >= 400) return response
    const location = response.headers.get("location")
    if (!location) throw new Error("리디렉션 위치가 없습니다.")
    current = new URL(location, current)
  }
  throw new Error("리디렉션 횟수 제한을 초과했습니다.")
}

export async function fetchRegisteredHtml(
  source: RegisteredSource,
): Promise<{ readonly body: string; readonly finalUrl: string; readonly status: number }> {
  const target = new URL(source.canonicalUrl)
  await assertPublicHost(target, source)
  const robotsUrl = new URL("/robots.txt", target)
  const robotsResponse = await boundedFetch(robotsUrl, source)
  if (robotsResponse.ok) {
    const robots = robotsParser(robotsUrl.href, await robotsResponse.text())
    if (robots.isAllowed(target.href, userAgent) === false)
      throw new Error("robots.txt가 수집을 허용하지 않습니다.")
  }
  const response = await boundedFetch(target, source)
  if (!response.ok) throw new Error(`원격 소스 응답 오류: ${response.status}`)
  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.includes("text/html") && !contentType.includes("application/json"))
    throw new Error(`지원하지 않는 콘텐츠 형식: ${contentType}`)
  const declaredLength = Number(response.headers.get("content-length") ?? 0)
  if (declaredLength > maxBytes) throw new Error("응답 크기 제한을 초과했습니다.")
  const bytes = new Uint8Array(await response.arrayBuffer())
  if (bytes.byteLength > maxBytes) throw new Error("응답 크기 제한을 초과했습니다.")
  return {
    body: new TextDecoder().decode(bytes),
    finalUrl: response.url || target.href,
    status: response.status,
  }
}
