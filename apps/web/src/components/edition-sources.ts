import type { Edition } from "@conf/contracts"

export interface EditionSourceLink {
  readonly label: string
  readonly url: string
}

function sourceLabel(url: string, index: number): string {
  const normalized = url.toLowerCase()
  if (/callforpapers|\/cfp(?:\/|\.|$)|important[-_]dates?|deadlines?/.test(normalized)) {
    return "CFP / important dates"
  }
  return index === 0 ? "Official site" : "Additional official source"
}

export function editionSourceLinks(edition: Edition): readonly EditionSourceLink[] {
  const urls = [edition.officialUrl, ...(edition.additionalSourceUrls ?? [])]
  return [...new Set(urls)].map((url, index) => ({ label: sourceLabel(url, index), url }))
}
