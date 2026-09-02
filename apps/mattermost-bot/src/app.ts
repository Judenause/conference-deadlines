import { type Catalog, catalogSchema, type Edition } from "@conf/contracts"
import { Hono } from "hono"
import ky from "ky"
import { z } from "zod"

export type MattermostWorkerEnv = {
  readonly CATALOG_URL: string
  readonly MATTERMOST_COMMAND_TOKEN: string
}

type CatalogLoader = (catalogUrl: string) => Promise<Catalog>

type MattermostCommandResponse = {
  readonly response_type: "ephemeral" | "in_channel"
  readonly text: string
}

const commandTextSchema = z.string().trim().min(1).max(120)
const ignoredQueryTerms = new Set([
  "일정",
  "알려줘",
  "알려",
  "주세요",
  "보여줘",
  "보여",
  "마감",
  "학회",
  "conference",
  "deadline",
])

async function loadPublishedCatalog(catalogUrl: string): Promise<Catalog> {
  return catalogSchema.parse(
    await ky.get(catalogUrl, { retry: 1, timeout: 10_000 }).json<unknown>(),
  )
}

function normalized(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
}

function queryTerms(text: string): readonly string[] {
  return normalized(text)
    .split(" ")
    .filter((term) => term.length > 0 && !ignoredQueryTerms.has(term))
}

function queryMatchScore(edition: Edition, terms: readonly string[]): number {
  const query = terms.join(" ")
  const acronym = normalized(edition.acronym)
  if (acronym === query || acronym.startsWith(`${query} `)) return 3

  const name = normalized(edition.name)
  if (name === query || name.startsWith(`${query} `)) return 2

  const searchable = normalized(`${edition.acronym} ${edition.name}`)
  return terms.every((term) => searchable.includes(term)) ? 1 : 0
}

function nextScheduleAt(edition: Edition, now: string): string | undefined {
  const upcomingDeadline = edition.deadlines
    .map((deadline) => deadline.dueAtUtc)
    .filter((dueAtUtc) => dueAtUtc >= now)
    .sort()[0]
  if (upcomingDeadline) return upcomingDeadline
  if (edition.conferenceEnd && `${edition.conferenceEnd}T23:59:59Z` >= now)
    return `${edition.conferenceEnd}T23:59:59Z`
  return undefined
}

function findEdition(catalog: Catalog, text: string, now: string): Edition | undefined {
  const terms = queryTerms(text)
  if (terms.length === 0) return undefined

  return catalog.editions
    .map((edition) => ({ edition, score: queryMatchScore(edition, terms) }))
    .filter((match) => match.score > 0)
    .sort((left, right) => {
      if (left.score !== right.score) return right.score - left.score

      const leftSchedule = nextScheduleAt(left.edition, now)
      const rightSchedule = nextScheduleAt(right.edition, now)
      if (leftSchedule && rightSchedule) return leftSchedule.localeCompare(rightSchedule)
      if (leftSchedule) return -1
      if (rightSchedule) return 1
      return right.edition.year - left.edition.year
    })[0]?.edition
}

function formatConferenceDates(edition: Edition): string | undefined {
  if (edition.conferenceStart && edition.conferenceEnd)
    return edition.conferenceStart === edition.conferenceEnd
      ? edition.conferenceStart
      : `${edition.conferenceStart} ~ ${edition.conferenceEnd}`
  return edition.dateRange === "공식 일정 검수 중" ? undefined : edition.dateRange
}

function formatEdition(edition: Edition): string {
  const deadlineLines = edition.deadlines
    .slice()
    .sort((left, right) => left.dueAtUtc.localeCompare(right.dueAtUtc))
    .map((deadline) => `- **${deadline.label}**: ${deadline.displayDate} (${deadline.timezone})`)
  const conferenceDates = formatConferenceDates(edition)
  const lines = [`#### ${edition.acronym}`, ...deadlineLines]
  if (conferenceDates) lines.push(`- **학회 개최**: ${conferenceDates}`)
  lines.push(`- **공식 사이트**: ${edition.officialUrl}`)
  if (edition.status === "timezone-review-needed") lines.push("_시간대 검수 필요_")
  return lines.join("\n")
}

function response(
  responseType: MattermostCommandResponse["response_type"],
  text: string,
): MattermostCommandResponse {
  return { response_type: responseType, text }
}

function commandIsAuthorized(authorization: string | undefined, expectedToken: string): boolean {
  return authorization === `Token ${expectedToken}`
}

export function createMattermostApp(
  catalogLoader: CatalogLoader = loadPublishedCatalog,
): Hono<{ Bindings: MattermostWorkerEnv }> {
  const app = new Hono<{ Bindings: MattermostWorkerEnv }>()

  app.get("/health", (context) => context.json({ status: "ok" }))

  app.post("/mattermost/command", async (context) => {
    if (
      !commandIsAuthorized(
        context.req.header("Authorization"),
        context.env.MATTERMOST_COMMAND_TOKEN,
      )
    )
      return context.json(response("ephemeral", "인증되지 않은 Mattermost 요청입니다."), 401)

    const form = await context.req.parseBody()
    const parsedText = commandTextSchema.safeParse(form.text)
    if (!parsedText.success)
      return context.json(response("ephemeral", "학회명을 입력해 주세요. 예: `/conf DAC`"), 400)

    const edition = findEdition(
      await catalogLoader(context.env.CATALOG_URL),
      parsedText.data,
      new Date().toISOString(),
    )
    if (!edition)
      return context.json(
        response(
          "ephemeral",
          `“${parsedText.data}”에 해당하는 학회를 찾지 못했습니다. 예: \`/conf DAC\``,
        ),
      )

    return context.json(response("in_channel", formatEdition(edition)))
  })

  app.onError((_error, context) =>
    context.json(
      response(
        "ephemeral",
        "일정 카탈로그를 지금 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      ),
      502,
    ),
  )

  return app
}
