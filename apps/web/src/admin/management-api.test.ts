import { afterEach, expect, test, vi } from "vitest"
import { type ManagementApiConfig, submitConferenceRequest } from "./management-api"

const config = { apiUrl: "https://manage.example.org" } satisfies ManagementApiConfig

afterEach(() => vi.restoreAllMocks())

test("conference intake posts a validated request to the self-hosted management API", async () => {
  let receivedPath = ""
  let receivedOptions: RequestInit | undefined
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, options?: RequestInit) => {
    receivedPath = String(input)
    receivedOptions = options
    return new Response("{}", { status: 201 })
  })

  await submitConferenceRequest(config, {
    name: "ExampleConf",
    officialUrl: "https://example.org",
    category: "AI",
    note: "annual main track",
  })

  expect(receivedPath).toBe("https://manage.example.org/api/v1/admin/conference-requests")
  expect(receivedOptions).toMatchObject({ method: "POST", credentials: "include" })
  expect(JSON.parse(String(receivedOptions?.body))).toMatchObject({ name: "ExampleConf" })
})
