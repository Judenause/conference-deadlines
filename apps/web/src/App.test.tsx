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
  vi.useRealTimers()
  window.localStorage.clear()
  delete document.documentElement.dataset.theme
})

test("researcher searches and opens a remaining 2026 deadline with evidence", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      const body = url.includes("/catalog/meta")
        ? { lastCheckedAt: "2026-09-01T00:00:00Z" }
        : url.includes("/evidence")
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
  expect(await screen.findByRole("searchbox")).toBeTruthy()
  expect(screen.queryByText("Find your next conference deadline.")).toBeNull()
  expect(screen.getByRole("heading", { name: "IRIS Conference Deadline 학회 일정" })).toBeTruthy()
  expect(screen.getByText("IRIS Conference Deadline")).toBeTruthy()
  fireEvent.click(screen.getByRole("tab", { name: "목록" }))

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
  expect(screen.getByText("Last checked")).toBeTruthy()
  expect((await screen.findAllByText("시간대 검수 필요")).length).toBeGreaterThan(0)
}, 10_000)

test("empty search explains the result", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const body = String(input).includes("/catalog/meta")
        ? { lastCheckedAt: "2026-09-01T00:00:00Z" }
        : { items: seed.editions }
      return new Response(JSON.stringify(body), { status: 200 })
    }),
  )
  render(<App />)
  fireEvent.change(await screen.findByRole("searchbox"), { target: { value: "없는학회" } })
  expect(await screen.findByText("검색 결과가 없습니다")).toBeTruthy()
})

test("management requests remain disabled until Firebase administrator configuration exists", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const body = String(input).includes("/catalog/meta")
        ? { lastCheckedAt: "2026-09-01T00:00:00Z" }
        : { items: seed.editions }
      return new Response(JSON.stringify(body), { status: 200 })
    }),
  )

  render(<App />)
  fireEvent.click(await screen.findByRole("link", { name: "Manage" }))

  expect(await screen.findByRole("heading", { name: "학회 관리" })).toBeTruthy()
  expect(screen.getByText("Firebase 연결 후 활성화됩니다.")).toBeTruthy()
  expect(screen.getByRole("button", { name: "추가 요청 저장" })).toHaveProperty("disabled", true)
  fireEvent.click(screen.getByRole("button", { name: "일정 수정" }))
  expect(screen.getByRole("button", { name: "수정 요청 저장" })).toHaveProperty("disabled", true)
})

test("visitor lands on the monthly timeline and switches the saved color theme", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const body = String(input).includes("/catalog/meta")
        ? { lastCheckedAt: "2026-09-01T00:00:00Z" }
        : { items: seed.editions }
      return new Response(JSON.stringify(body), { status: 200 })
    }),
  )

  render(<App />)
  expect(await screen.findByRole("searchbox")).toBeTruthy()
  expect(screen.queryByText("Find your next conference deadline.")).toBeNull()
  expect(screen.getByRole("heading", { name: "IRIS Conference Deadline 학회 일정" })).toBeTruthy()
  const trustSummary = screen.getByRole("region", { name: "데이터 신뢰도 요약" })
  expect(within(trustSummary).getByText("Last updated")).toBeTruthy()
  expect(within(trustSummary).getByText("2026.09.01").getAttribute("dateTime")).toBe(
    "2026-09-01T00:00:00Z",
  )
  expect(screen.queryByText("Operator curated")).toBeNull()
  expect(screen.queryByText("수집 원칙")).toBeNull()
  expect(screen.queryByRole("link", { name: "GitHub" })).toBeNull()
  expect(screen.getByRole("tab", { name: "타임라인" }).getAttribute("aria-selected")).toBe("true")
  const categoryFilters = screen.getByRole("group", { name: "분야 필터" })
  const viewSwitcher = screen.getByRole("tablist", { name: "보기 방식" })
  expect(categoryFilters.closest(".product-header__actions")).toBe(
    viewSwitcher.closest(".product-header__actions"),
  )
  expect(categoryFilters.closest(".hero")).toBeNull()

  const themeButton = screen.getAllByRole("button", { name: "다크 모드로 전환" })[0]
  expect(themeButton).toBeTruthy()
  if (themeButton) fireEvent.click(themeButton)
  expect(document.documentElement.dataset.theme).toBe("dark")
  expect(window.localStorage.getItem("conference-atlas-theme")).toBe("dark")

  const timeline = await screen.findByRole("region", { name: "월별 학회 타임라인" })
  expect(within(timeline).getByRole("heading", { name: /^Circuit/ })).toBeTruthy()
  expect(within(timeline).getByRole("heading", { name: /^System/ })).toBeTruthy()
  const circuitGroup = within(timeline)
    .getByRole("heading", { name: /^Circuit/ })
    .closest("details")
  if (!(circuitGroup instanceof HTMLDetailsElement)) {
    throw new Error("Circuit group disclosure is missing")
  }
  const circuitDisclosure = circuitGroup.querySelector("summary")
  if (!circuitDisclosure) throw new Error("Circuit group summary is missing")
  fireEvent.click(circuitDisclosure)
  expect(circuitGroup.open).toBe(false)
  fireEvent.click(screen.getByRole("button", { name: "System" }))
  expect(within(timeline).queryByRole("heading", { name: /^Circuit/ })).toBeNull()
  expect(screen.getByText("제출일 · 학회 기간 타임라인")).toBeTruthy()
  expect(screen.getAllByRole("link", { name: /공식 사이트 열기/ }).length).toBeGreaterThan(0)
})

test("timeline uses the next event's actual kind instead of a generic submission label", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date("2026-08-22T00:00:00Z"))
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const body = String(input).includes("/catalog/meta")
        ? { lastCheckedAt: "2026-09-01T00:00:00Z" }
        : { items: seed.editions }
      return new Response(JSON.stringify(body), { status: 200 })
    }),
  )

  render(<App />)

  const marker = await screen.findByRole("button", {
    name: "NeurIPS 2026 워크숍 기여 권장 제출일 2026. 8. 29 23:59 상세 보기",
  })
  expect(marker.textContent).toBe("워크숍 제출")
})

test("lab timeline categories expose curated conferences and BK tiers", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const body = String(input).includes("/catalog/meta")
        ? { lastCheckedAt: "2026-09-01T00:00:00Z" }
        : { items: seed.editions }
      return new Response(JSON.stringify(body), { status: 200 })
    }),
  )

  render(<App />)
  expect(await screen.findByRole("link", { name: "연구실 Timeline 원본 열기" })).toBeTruthy()
  fireEvent.click(screen.getByRole("tab", { name: "목록" }))
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

test("official CFP links and verification date stay visible in the detail panel", () => {
  const isca: Edition = {
    id: "isca-2026",
    acronym: "ISCA 2026",
    name: "ISCA",
    year: 2026,
    location: "Raleigh, USA",
    dateRange: "2026. 6. 27 - 7. 1",
    conferenceStart: "2026-06-27",
    conferenceEnd: "2026-07-01",
    officialUrl: "https://iscaconf.org/isca2026/",
    additionalSourceUrls: ["https://iscaconf.org/isca2026/submit/callforpapers.php"],
    tier: "T1 (BK)",
    categories: ["Archi"],
    status: "confirmed",
    description: "fixture",
    registrySource: "curated",
    registrySourceUrl: "https://iscaconf.org/isca2026/",
    registryRecordId: null,
    deadlines: [],
  }

  render(
    <EvidencePanel
      compact={false}
      edition={isca}
      evidence={[
        {
          id: "isca-cfp",
          editionId: "isca-2026",
          deadlineId: "isca-2026-paper_submission",
          sourceTitle: "ISCA 2026 Call for Papers",
          sourceUrl: "https://iscaconf.org/isca2026/submit/callforpapers.php",
          checkedAt: "2026-09-01T00:00:00Z",
          rawValue: "Full paper submission: November 17, 2025, 11:59 PM AoE",
          locator: "Main Track · Important Dates",
          confidence: 0.99,
        },
      ]}
      history={[]}
      loading={false}
      onClose={() => undefined}
    />,
  )

  expect(screen.getByRole("link", { name: "ISCA 2026 CFP / important dates" })).toBeTruthy()
  expect(screen.getByText("Last checked")).toBeTruthy()
})
