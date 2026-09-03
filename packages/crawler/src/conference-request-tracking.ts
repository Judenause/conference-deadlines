import type { Edition } from "@conf/contracts"
import type { ConferenceRequestRecord } from "./management-requests"

function normalizedUrl(value: string): string {
  const url = new URL(value)
  url.hash = ""
  url.pathname = url.pathname.replace(/\/+$/, "") || "/"
  url.protocol = url.protocol.toLocaleLowerCase("en-US")
  url.hostname = url.hostname.toLocaleLowerCase("en-US")
  return url.href
}

export function findTrackedEditionIndex(
  editions: readonly Edition[],
  request: ConferenceRequestRecord,
): number {
  const url = normalizedUrl(request.officialUrl)
  return editions.findIndex(
    (edition) =>
      edition.registryRecordId === request.id || normalizedUrl(edition.officialUrl) === url,
  )
}
