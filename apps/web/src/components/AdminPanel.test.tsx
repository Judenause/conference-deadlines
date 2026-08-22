// @vitest-environment jsdom

import type { Edition } from "@conf/contracts"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useId } from "react"
import { afterEach, expect, test, vi } from "vitest"
import { AdminPanel } from "./AdminPanel"

const firebaseMocks = vi.hoisted(() => ({
  signIn: vi.fn(async () => ({ idToken: "token", email: "operator@example.org" })),
  submitAddition: vi.fn(async () => undefined),
  submitOverride: vi.fn(async () => undefined),
}))

vi.mock("../admin/firebase-rest", async () => {
  const actual =
    await vi.importActual<typeof import("../admin/firebase-rest")>("../admin/firebase-rest")
  return {
    ...actual,
    getFirebaseAdminConfig: () => ({
      apiKey: "public-key",
      projectId: "project-id",
      googleClientId: "client-id",
    }),
    signInFirebaseAdmin: firebaseMocks.signIn,
    submitConferenceRequest: firebaseMocks.submitAddition,
    submitScheduleOverride: firebaseMocks.submitOverride,
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

  fireEvent.click(screen.getByRole("button", { name: "Google로 관리자 인증" }))
  await screen.findByText("operator@example.org 계정으로 인증했습니다.")
  const name = screen.getByRole("textbox", { name: "학회명" })
  const url = screen.getByRole("textbox", { name: "공식 홈페이지" })
  fireEvent.change(name, { target: { value: "NewConf" } })
  fireEvent.change(url, { target: { value: "https://newconf.example.org" } })
  fireEvent.click(screen.getByRole("button", { name: "추가 요청 저장" }))

  await screen.findByText(
    "학회 추가 요청을 저장했습니다. 공식 URL 확인 후 월간 수집 대상에 등록됩니다.",
  )
  await waitFor(() => expect(firebaseMocks.submitAddition).toHaveBeenCalledTimes(1))
  expect(name).toHaveProperty("value", "")
  expect(url).toHaveProperty("value", "")
})
