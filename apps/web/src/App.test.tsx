// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import seed from "../../../data/seed/catalog-state.json"
import { App } from "./App"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

test("researcher searches and opens deadline evidence and history", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      const body = url.includes("/evidence")
        ? { items: seed.evidence }
        : url.includes("/history")
          ? { items: seed.history }
          : url.includes("/api/v1/editions/")
            ? seed.editions[0]
            : { items: seed.editions }
      return new Response(JSON.stringify(body), { status: 200 })
    }),
  )

  render(<App />)
  expect(await screen.findByRole("heading", { name: "학회 마감 일정" })).toBeTruthy()

  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "CUI" } })
  fireEvent.click(await screen.findByRole("button", { name: /CUI 2026 상세 보기/ }))

  expect(await screen.findByText("논문 제출")).toBeTruthy()
  expect((await screen.findAllByRole("link", { name: /CUI 2026 Submission/ })).length).toBe(2)
  expect(await screen.findByText("논문 제출 마감 연장")).toBeTruthy()
})

test("empty search explains the result", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ items: seed.editions }), { status: 200 })),
  )
  render(<App />)
  fireEvent.change(await screen.findByRole("searchbox"), { target: { value: "없는학회" } })
  expect(await screen.findByText("검색 결과가 없습니다")).toBeTruthy()
})
