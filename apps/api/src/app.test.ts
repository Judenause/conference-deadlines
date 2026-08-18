import { expect, test } from "bun:test"
import { createApp } from "./app"

test("empty search is a successful empty collection", async () => {
  const response = await createApp().request("/api/v1/editions?q=does-not-exist")
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ items: [] })
})

test("catalog request can return every imported Notion record", async () => {
  const response = await createApp().request("/api/v1/editions?limit=250")
  const body = await response.json()

  expect(response.status).toBe(200)
  expect(body.items.length).toBe(111)
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
  expect(await history.json()).toMatchObject({
    items: [{ editionId: "micro-2026", state: "accepted" }],
  })
})
