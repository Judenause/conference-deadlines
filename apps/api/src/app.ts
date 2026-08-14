import { editionQuerySchema } from "@conf/contracts"
import { findEdition, getCatalog } from "@conf/storage"
import { Hono } from "hono"

function problem(status: 400 | 404, slug: string, title: string, detail: string) {
  return {
    type: `https://conf.local/problems/${slug}`,
    title,
    status,
    detail,
  }
}

export function createApp(): Hono {
  const app = new Hono()
  app.get("/api/v1/health", (context) => context.json({ status: "ok" }))

  app.get("/api/v1/editions", (context) => {
    const parsed = editionQuerySchema.safeParse(context.req.query())
    if (!parsed.success) {
      return context.json(
        problem(400, "invalid-query", "잘못된 요청", "검색 조건을 확인해 주세요."),
        400,
      )
    }
    const query = parsed.data.q?.toLocaleLowerCase("ko")
    const category = parsed.data.category?.toLocaleLowerCase("ko")
    const filtered = getCatalog().editions.filter((edition) => {
      const matchesQuery =
        !query || `${edition.acronym} ${edition.name}`.toLocaleLowerCase("ko").includes(query)
      const matchesCategory =
        !category || edition.categories.some((value) => value.toLocaleLowerCase("ko") === category)
      return matchesQuery && matchesCategory
    })
    return context.json({ items: filtered.slice(0, parsed.data.limit ?? 50) })
  })

  app.get("/api/v1/editions/:editionId", (context) => {
    const edition = findEdition(context.req.param("editionId"))
    if (!edition)
      return context.json(
        problem(404, "not-found", "찾을 수 없음", "학회가 존재하지 않습니다."),
        404,
      )
    return context.json(edition)
  })

  app.get("/api/v1/editions/:editionId/evidence", (context) => {
    const editionId = context.req.param("editionId")
    if (!findEdition(editionId)) {
      return context.json(
        problem(404, "not-found", "찾을 수 없음", "학회가 존재하지 않습니다."),
        404,
      )
    }
    return context.json({
      items: getCatalog().evidence.filter((item) => item.editionId === editionId),
    })
  })

  app.get("/api/v1/editions/:editionId/history", (context) => {
    const editionId = context.req.param("editionId")
    if (!findEdition(editionId)) {
      return context.json(
        problem(404, "not-found", "찾을 수 없음", "학회가 존재하지 않습니다."),
        404,
      )
    }
    return context.json({
      items: getCatalog().history.filter((item) => item.editionId === editionId),
    })
  })

  return app
}
