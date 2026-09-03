import { expect, test } from "bun:test"
import { getCatalog } from "@conf/storage"
import { createApp } from "./app"
import { ManagementStore } from "./management-store"

const managementAuth = {
  googleClientId: "client-id.apps.googleusercontent.com",
  googleClientSecret: "test-secret",
  publicUrl: "https://manage.example.org",
  publicWebOrigin: "https://site.example.org",
  adminEmails: new Set(["operator@example.org"]),
  secureCookies: true,
}

async function testManagementApp() {
  const store = new ManagementStore(":memory:")
  const sessionToken = "test-admin-session"
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sessionToken))
  const tokenHash = Buffer.from(digest).toString("base64url")
  store.saveSession(tokenHash, {
    email: "operator@example.org",
    expiresAt: "2027-01-01T00:00:00.000Z",
  })
  return {
    app: createApp({
      managementStore: store,
      managementAuth,
      managementSyncToken: "sync-token",
    }),
    store,
    headers: { cookie: `conference_admin_session=${sessionToken}` },
  }
}

test("empty search is a successful empty collection", async () => {
  const response = await createApp().request("/api/v1/editions?q=does-not-exist")
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ items: [] })
})

test("catalog request can return every imported Notion record", async () => {
  const response = await createApp().request("/api/v1/editions?limit=250")
  const body = await response.json()

  expect(response.status).toBe(200)
  expect(body.items.length).toBe(getCatalog().editions.length)
})

test("malformed limit is a typed problem response", async () => {
  const response = await createApp().request("/api/v1/editions?limit=nope")
  expect(response.status).toBe(400)
  expect(await response.json()).toMatchObject({
    type: "https://conf.local/problems/invalid-query",
    title: "잘못된 요청",
    status: 400,
  })
})

test("edition exposes its evidence and history collection", async () => {
  const detail = await createApp().request("/api/v1/editions/micro-2026")
  const evidence = await createApp().request("/api/v1/editions/micro-2026/evidence")
  const history = await createApp().request("/api/v1/editions/micro-2026/history")
  expect(detail.status).toBe(200)
  expect((await evidence.json()).items.length).toBeGreaterThan(0)
  expect((await history.json()).items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ editionId: "micro-2026", state: "accepted" }),
    ]),
  )
})

test("catalog metadata exposes the latest evidence check time", async () => {
  const response = await createApp().request("/api/v1/catalog/meta")
  const expectedLastCheckedAt = getCatalog().evidence.reduce<string | null>(
    (latest, item) => (!latest || item.checkedAt > latest ? item.checkedAt : latest),
    null,
  )

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ lastCheckedAt: expectedLastCheckedAt })
})

test("management API stores, reviews, and exposes only approved conference requests to sync", async () => {
  const { app, store, headers } = await testManagementApp()
  const created = await app.request("/api/v1/admin/conference-requests", {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({
      name: "ExampleConf",
      officialUrl: "https://example.org/cfp",
      category: "AI",
      note: "annual conference",
    }),
  })
  expect(created.status).toBe(201)
  const request = (await created.json()) as { id: string; status: string; submittedBy: string }
  expect(request).toMatchObject({ status: "submitted", submittedBy: "operator@example.org" })

  const hidden = await app.request("/api/v1/internal/conference-requests", {
    headers: { authorization: "Bearer sync-token" },
  })
  expect(await hidden.json()).toEqual({ items: [] })

  const reviewed = await app.request(`/api/v1/admin/requests/conference/${request.id}/review`, {
    method: "PATCH",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ status: "approved", note: "official page confirmed" }),
  })
  expect(reviewed.status).toBe(204)

  const sync = await app.request("/api/v1/internal/conference-requests", {
    headers: { authorization: "Bearer sync-token" },
  })
  expect(await sync.json()).toMatchObject({
    items: [
      {
        id: request.id,
        name: "ExampleConf",
        status: "approved",
      },
    ],
  })
  store.close()
})

test("management API rejects an unauthenticated write", async () => {
  const store = new ManagementStore(":memory:")
  const app = createApp({ managementStore: store, managementAuth })
  const response = await app.request("/api/v1/admin/conference-requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  })
  expect(response.status).toBe(401)
  store.close()
})
