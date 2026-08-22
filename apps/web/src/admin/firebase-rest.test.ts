import { afterEach, expect, test, vi } from "vitest"
import {
  type FirebaseAdminConfig,
  type FirebaseAdminSession,
  submitConferenceRequest,
  submitScheduleOverride,
} from "./firebase-rest"

const config = {
  apiKey: "public-api-key",
  projectId: "deadline-project",
  googleClientId: "client-id.apps.googleusercontent.com",
} satisfies FirebaseAdminConfig

const session = {
  idToken: "firebase-id-token",
  email: "operator@example.org",
} satisfies FirebaseAdminSession

afterEach(() => vi.restoreAllMocks())

test("conference intake serializes only a submitted review request", async () => {
  let receivedOptions: RequestInit | undefined
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, options?: RequestInit) => {
    receivedOptions = options
    return new Response("{}", { status: 200 })
  })
  vi.stubGlobal("fetch", fetchMock)

  await submitConferenceRequest(config, session, {
    name: "ExampleConf",
    officialUrl: "https://example.org",
    category: "AI",
    note: "annual main track",
  })

  expect(fetchMock).toHaveBeenCalledTimes(1)
  if (!receivedOptions) throw new Error("Firebase request options were not captured")
  expect(receivedOptions.headers).toMatchObject({ authorization: "Bearer firebase-id-token" })
  expect(JSON.parse(String(receivedOptions.body))).toMatchObject({
    fields: {
      name: { stringValue: "ExampleConf" },
      officialUrl: { stringValue: "https://example.org" },
      category: { stringValue: "AI" },
      submittedBy: { stringValue: "operator@example.org" },
      status: { stringValue: "submitted" },
    },
  })
})

test("schedule override reports a rejected administrator write", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("forbidden", { status: 403 })),
  )

  await expect(
    submitScheduleOverride(config, session, {
      editionId: "example-2027",
      deadlineId: null,
      value: "2027. 5. 13 23:59 AoE",
      evidenceUrl: "https://example.org/cfp",
      note: "official CFP update",
    }),
  ).rejects.toThrow("adminUsers 문서")
})
