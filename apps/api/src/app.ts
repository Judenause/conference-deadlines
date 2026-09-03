import {
  conferenceRequestInputSchema,
  editionQuerySchema,
  managementRequestKindSchema,
  managementRequestStatusSchema,
  managementReviewInputSchema,
  scheduleOverrideInputSchema,
} from "@conf/contracts"
import { findEdition, getCatalog } from "@conf/storage"
import { Hono } from "hono"
import { cors } from "hono/cors"
import {
  createGoogleAuthorizationUrl,
  deleteSession,
  exchangeGoogleAuthorizationCode,
  getSession,
  type ManagementAuthConfig,
  readCookie,
  readManagementAuthConfig,
  sessionCookie,
} from "./admin-auth"
import { ManagementStore } from "./management-store"

function problem(status: number, slug: string, title: string, detail: string) {
  return {
    type: `https://conf.local/problems/${slug}`,
    title,
    status,
    detail,
  }
}

export interface AppOptions {
  readonly managementStore?: ManagementStore
  readonly managementAuth?: ManagementAuthConfig
  readonly managementSyncToken?: string
}

function defaultManagementStore(): ManagementStore {
  return new ManagementStore(Bun.env.MANAGEMENT_DB_PATH ?? ".local/runtime/management.sqlite")
}

export function createApp(options: AppOptions = {}): Hono {
  const app = new Hono()
  const managementStore = options.managementStore ?? defaultManagementStore()
  const managementAuth = options.managementAuth ?? readManagementAuthConfig()
  const managementSyncToken = options.managementSyncToken ?? Bun.env.MANAGEMENT_SYNC_TOKEN
  if (managementAuth) {
    app.use(
      "/api/v1/admin/*",
      cors({
        origin: managementAuth.publicWebOrigin,
        credentials: true,
        allowHeaders: ["content-type"],
        allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
      }),
    )
  }
  app.get("/api/v1/health", (context) => context.json({ status: "ok" }))

  app.get("/api/v1/catalog/meta", (context) => {
    const lastCheckedAt = getCatalog().evidence.reduce<string | null>(
      (latest, item) => (!latest || item.checkedAt > latest ? item.checkedAt : latest),
      null,
    )
    return context.json({ lastCheckedAt })
  })

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

  app.get("/api/v1/admin/session", async (context) => {
    if (!managementAuth)
      return context.json(
        problem(
          503,
          "management-unconfigured",
          "관리 서버 미설정",
          "관리자 로그인이 아직 설정되지 않았습니다.",
        ),
        503,
      )
    const session = await getSession(
      managementStore,
      readCookie(context.req.raw, "conference_admin_session"),
    )
    if (!session)
      return context.json(
        problem(401, "not-authenticated", "로그인 필요", "Google 로그인이 필요합니다."),
        401,
      )
    return context.json({ email: session.email, expiresAt: session.expiresAt })
  })

  app.get("/api/v1/admin/auth/google/start", async (context) => {
    if (!managementAuth)
      return context.json(
        problem(
          503,
          "management-unconfigured",
          "관리 서버 미설정",
          "관리자 로그인이 아직 설정되지 않았습니다.",
        ),
        503,
      )
    try {
      return context.redirect(
        await createGoogleAuthorizationUrl(
          managementStore,
          managementAuth,
          context.req.query("returnTo"),
        ),
      )
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Google 로그인을 시작하지 못했습니다."
      return context.json(problem(400, "invalid-login", "로그인 요청 오류", detail), 400)
    }
  })

  app.get("/api/v1/admin/auth/google/callback", async (context) => {
    if (!managementAuth)
      return context.json(
        problem(
          503,
          "management-unconfigured",
          "관리 서버 미설정",
          "관리자 로그인이 아직 설정되지 않았습니다.",
        ),
        503,
      )
    try {
      const result = await exchangeGoogleAuthorizationCode(
        managementStore,
        managementAuth,
        context.req.query("state"),
        context.req.query("code"),
      )
      context.header("set-cookie", sessionCookie(result.sessionToken, managementAuth))
      return context.redirect(result.returnTo)
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Google 로그인을 완료하지 못했습니다."
      return context.json(problem(401, "google-login-failed", "관리자 로그인 실패", detail), 401)
    }
  })

  app.post("/api/v1/admin/auth/logout", async (context) => {
    if (!managementAuth)
      return context.json(
        problem(
          503,
          "management-unconfigured",
          "관리 서버 미설정",
          "관리자 로그인이 아직 설정되지 않았습니다.",
        ),
        503,
      )
    await deleteSession(managementStore, readCookie(context.req.raw, "conference_admin_session"))
    context.header("set-cookie", sessionCookie("", managementAuth, 0))
    return context.body(null, 204)
  })

  async function authenticatedEmail(context: { readonly req: { readonly raw: Request } }) {
    if (!managementAuth) return undefined
    return getSession(managementStore, readCookie(context.req.raw, "conference_admin_session"))
  }

  app.get("/api/v1/admin/conference-requests", async (context) => {
    const session = await authenticatedEmail(context)
    if (!session)
      return context.json(
        problem(401, "not-authenticated", "로그인 필요", "Google 로그인이 필요합니다."),
        401,
      )
    const status = context.req.query("status")
    const parsedStatus =
      status === undefined ? undefined : managementRequestStatusSchema.safeParse(status)
    if (parsedStatus && !parsedStatus.success)
      return context.json(
        problem(400, "invalid-status", "잘못된 상태", "요청 상태를 확인해 주세요."),
        400,
      )
    return context.json({ items: managementStore.listConferenceRequests(parsedStatus?.data) })
  })

  app.post("/api/v1/admin/conference-requests", async (context) => {
    const session = await authenticatedEmail(context)
    if (!session)
      return context.json(
        problem(401, "not-authenticated", "로그인 필요", "Google 로그인이 필요합니다."),
        401,
      )
    const parsed = conferenceRequestInputSchema.safeParse(
      await context.req.json().catch(() => undefined),
    )
    if (!parsed.success)
      return context.json(
        problem(400, "invalid-request", "입력 오류", "학회 추가 요청을 확인해 주세요."),
        400,
      )
    return context.json(managementStore.createConferenceRequest(parsed.data, session.email), 201)
  })

  app.get("/api/v1/admin/schedule-overrides", async (context) => {
    const session = await authenticatedEmail(context)
    if (!session)
      return context.json(
        problem(401, "not-authenticated", "로그인 필요", "Google 로그인이 필요합니다."),
        401,
      )
    const status = context.req.query("status")
    const parsedStatus =
      status === undefined ? undefined : managementRequestStatusSchema.safeParse(status)
    if (parsedStatus && !parsedStatus.success)
      return context.json(
        problem(400, "invalid-status", "잘못된 상태", "요청 상태를 확인해 주세요."),
        400,
      )
    return context.json({ items: managementStore.listScheduleOverrides(parsedStatus?.data) })
  })

  app.post("/api/v1/admin/schedule-overrides", async (context) => {
    const session = await authenticatedEmail(context)
    if (!session)
      return context.json(
        problem(401, "not-authenticated", "로그인 필요", "Google 로그인이 필요합니다."),
        401,
      )
    const parsed = scheduleOverrideInputSchema.safeParse(
      await context.req.json().catch(() => undefined),
    )
    if (!parsed.success)
      return context.json(
        problem(400, "invalid-request", "입력 오류", "일정 수정 요청을 확인해 주세요."),
        400,
      )
    return context.json(managementStore.createScheduleOverride(parsed.data, session.email), 201)
  })

  app.patch("/api/v1/admin/requests/:kind/:id/review", async (context) => {
    const session = await authenticatedEmail(context)
    if (!session)
      return context.json(
        problem(401, "not-authenticated", "로그인 필요", "Google 로그인이 필요합니다."),
        401,
      )
    const kind = managementRequestKindSchema.safeParse(context.req.param("kind"))
    const review = managementReviewInputSchema.safeParse(
      await context.req.json().catch(() => undefined),
    )
    if (!kind.success || !review.success)
      return context.json(
        problem(400, "invalid-review", "검수 입력 오류", "승인 또는 반려 정보를 확인해 주세요."),
        400,
      )
    const updated = managementStore.reviewRequest(
      kind.data,
      context.req.param("id"),
      review.data,
      session.email,
    )
    if (!updated)
      return context.json(
        problem(
          404,
          "request-not-found",
          "요청을 찾을 수 없음",
          "이미 처리되었거나 존재하지 않는 요청입니다.",
        ),
        404,
      )
    return context.body(null, 204)
  })

  app.get("/api/v1/internal/conference-requests", (context) => {
    const authorized =
      managementSyncToken && context.req.header("authorization") === `Bearer ${managementSyncToken}`
    if (!authorized)
      return context.json(
        problem(401, "sync-unauthorized", "동기화 권한 없음", "서버 동기화 토큰이 필요합니다."),
        401,
      )
    return context.json({ items: managementStore.listConferenceRequests("approved") })
  })

  return app
}
