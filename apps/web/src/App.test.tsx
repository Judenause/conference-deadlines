// @vitest-environment jsdom

import type { Edition } from "@conf/contracts"
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import seed from "../../../data/seed/catalog-state.json"
import { App } from "./App"
import { EvidencePanel } from "./components/EvidencePanel"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

test("researcher searches and opens a remaining 2026 deadline with evidence", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      const body = url.includes("/evidence")
        ? { items: seed.evidence }
        : url.includes("/history")
          ? { items: seed.history }
          : url.includes("/api/v1/editions/")
            ? seed.editions.find((edition) => url.includes(edition.id))
            : { items: seed.editions }
      return new Response(JSON.stringify(body), { status: 200 })
    }),
  )

  render(<App />)
  expect(await screen.findByRole("heading", { name: "학회 마감 일정" })).toBeTruthy()

  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "MICRO" } })
  expect(
    await screen.findByRole("link", {
      name: "MICRO 2026 공식 사이트 열기: https://www.microarch.org/micro59/",
    }),
  ).toBeTruthy()
  fireEvent.click(await screen.findByRole("button", { name: /MICRO 2026 상세 보기/ }))

  expect(await screen.findByText("최종본 제출")).toBeTruthy()
  expect(
    (await screen.findAllByRole("link", { name: /MICRO 2026 공식 일정/ })).length,
  ).toBeGreaterThanOrEqual(2)
  expect((await screen.findAllByText("시간대 검수 필요")).length).toBeGreaterThan(0)
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

test("lab timeline categories expose curated conferences and BK tiers", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ items: seed.editions }), { status: 200 })),
  )

  render(<App />)
  expect(await screen.findByRole("link", { name: "연구실 Timeline 원본 열기" })).toBeTruthy()
  const filters = await screen.findByRole("group", { name: "분야 필터" })
  expect(within(filters).queryByRole("button", { name: "HCI" })).toBeNull()
  fireEvent.click(within(filters).getByRole("button", { name: "Circuit" }))

  expect(await screen.findByRole("button", { name: /ICECS 2026 상세 보기/ })).toBeTruthy()
  expect(await screen.findByRole("button", { name: /ISSCC 2027 상세 보기/ })).toBeTruthy()
  expect(screen.getAllByText("T1 (Non)").length).toBeGreaterThan(0)
  expect(screen.getAllByText("최종본 제출").length).toBeGreaterThan(0)
  expect(screen.getAllByText("학회 개최").length).toBeGreaterThan(0)
  expect(screen.queryByRole("button", { name: /AAAI 2027 상세 보기/ })).toBeNull()

  fireEvent.click(within(filters).getByRole("button", { name: "전체" }))
  fireEvent.click(screen.getByRole("tab", { name: "캘린더" }))
  expect(
    await screen.findByRole("table", { name: "2026년 9월 제출 및 학회 개최 일정" }),
  ).toBeTruthy()
  expect(
    (await screen.findAllByRole("button", { name: /MICRO 2026 .*상세 보기/ })).length,
  ).toBeGreaterThan(0)
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Utah" } })
  expect(
    (await screen.findAllByRole("button", { name: /HPCA 2027 .*상세 보기/ })).length,
  ).toBeGreaterThan(0)
})

test("timezone assumptions remain visibly reviewable outside the public catalog", () => {
  const edition: Edition = {
    id: "timezone-review-fixture",
    acronym: "Timezone Review",
    name: "Timezone review fixture",
    year: 2027,
    location: "Online",
    dateRange: "검수 대기",
    conferenceStart: null,
    conferenceEnd: null,
    officialUrl: "https://example.com/timezone-review",
    tier: null,
    categories: ["System"],
    status: "timezone-review-needed",
    description: "원문에 시간대가 없어 AoE로 임시 계산한 테스트 fixture입니다.",
    registrySource: "curated",
    registrySourceUrl: "https://example.com/timezone-review",
    registryRecordId: null,
    deadlines: [
      {
        id: "timezone-review-paper",
        label: "논문 제출",
        kind: "paper_submission",
        dueAtUtc: "2027-04-01T11:59:59Z",
        displayDate: "2027. 3. 31 23:59",
        timezone: "AoE (UTC-12) · 시간대 가정",
        status: "timezone-review-needed",
        track: "Main track",
      },
    ],
  }

  render(
    <EvidencePanel
      compact={false}
      edition={edition}
      evidence={[]}
      history={[]}
      loading={false}
      onClose={() => undefined}
    />,
  )

  expect(screen.getByText("시간대 검수 필요")).toBeTruthy()
  expect(screen.getByText(/AoE \(UTC-12\) · 시간대 가정 · UTC/)).toBeTruthy()
  expect(
    screen
      .getByText("논문 제출")
      .closest("li")
      ?.querySelector(".deadline-check")
      ?.getAttribute("data-review"),
  ).toBe("true")
})
