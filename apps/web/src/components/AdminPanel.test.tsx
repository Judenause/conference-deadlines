// @vitest-environment jsdom

import type { Edition } from "@conf/contracts"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useId } from "react"
import { afterEach, expect, test, vi } from "vitest"
import { AdminPanel } from "./AdminPanel"

const managementMocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  getSession: vi.fn(async () => ({
    email: "operator@example.org",
    expiresAt: "2027-01-01T00:00:00.000Z",
  })),
  getRequests: vi.fn(async () => []),
  reviewRequest: vi.fn(async () => undefined),
  submitAddition: vi.fn(async () => undefined),
  submitOverride: vi.fn(async () => undefined),
}))

vi.mock("../admin/management-api", async () => {
  const actual =
    await vi.importActual<typeof import("../admin/management-api")>("../admin/management-api")
  return {
    ...actual,
    getManagementApiConfig: () => ({ apiUrl: "https://manage.example.org" }),
    getManagementAdminSession: managementMocks.getSession,
    getManagementRequests: managementMocks.getRequests,
    reviewManagementRequest: managementMocks.reviewRequest,
    signInManagementAdmin: managementMocks.signIn,
    submitConferenceRequest: managementMocks.submitAddition,
    submitScheduleOverride: managementMocks.submitOverride,
  }
})

const edition = {
  id: "example-2027",
  acronym: "EXAMPLE 2027",
  name: "Example Conference",
  year: 2027,
  location: "TBD",
  dateRange: "일정 미공개",
  conferenceStart: null,
  conferenceEnd: null,
  officialUrl: "https://example.org",
  tier: null,
  categories: ["AI"],
  status: "dates-pending",
  description: "Fixture",
  registrySource: "curated",
  registrySourceUrl: "https://example.org",
  registryRecordId: null,
  deadlines: [
    {
      id: "example-2027-paper",
      label: "논문 제출",
      kind: "paper_submission",
      dueAtUtc: "2027-05-01T11:59:59Z",
      displayDate: "2027. 4. 30",
      timezone: "AoE (UTC-12)",
      status: "confirmed",
      track: "Main conference",
    },
  ],
} satisfies Edition

function Fixture({ editions }: { readonly editions: readonly Edition[] }) {
  const id = useId()
  return <AdminPanel editions={editions} id={id} />
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

test("a late-loaded catalog selects its first edition for schedule override", () => {
  const rendered = render(<Fixture editions={[]} />)

  rendered.rerender(<Fixture editions={[edition]} />)
  fireEvent.click(screen.getByRole("button", { name: "일정 수정" }))

  expect(screen.getByRole("combobox", { name: "학회" })).toHaveProperty("value", "example-2027")
  expect(screen.getByRole("option", { name: "논문 제출 · Main conference" })).toBeTruthy()
})

test("a successful authenticated addition resets its original form after the async save", async () => {
  render(<Fixture editions={[edition]} />)

  await waitFor(() => expect(managementMocks.getSession).toHaveBeenCalledTimes(1))
  const name = screen.getByRole("textbox", { name: "학회명" })
  const url = screen.getByRole("textbox", { name: "공식 홈페이지" })
  fireEvent.change(name, { target: { value: "NewConf" } })
  fireEvent.change(url, { target: { value: "https://newconf.example.org" } })
  fireEvent.click(screen.getByRole("button", { name: "추가 요청 저장" }))

  await screen.findByText(
    "학회 추가 요청을 저장했습니다. 서버 검수 후 공식 수집 대상에 등록됩니다.",
  )
  await waitFor(() => expect(managementMocks.submitAddition).toHaveBeenCalledTimes(1))
  expect(name).toHaveProperty("value", "")
  expect(url).toHaveProperty("value", "")
})
