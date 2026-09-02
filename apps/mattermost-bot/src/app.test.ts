import { expect, test } from "bun:test"
import type { Catalog } from "@conf/contracts"
import { z } from "zod"
import { createMattermostApp } from "./app"

const catalog: Catalog = {
  editions: [
    {
      id: "dac-2026",
      acronym: "DAC 2026",
      name: "Design Automation Conference",
      year: 2026,
      location: "Long Beach, USA",
      dateRange: "2026. 7. 12 - 2026. 7. 16",
      conferenceStart: "2026-07-12",
      conferenceEnd: "2026-07-16",
      officialUrl: "https://dac.com/2026",
      tier: "T2",
      categories: ["Circuit"],
      status: "confirmed",
      description: "Official schedule",
      registrySource: "curated",
      registrySourceUrl: "https://dac.com/2026",
      registryRecordId: null,
      deadlines: [
        {
          id: "dac-2026-paper",
          label: "논문 제출",
          kind: "paper_submission",
          dueAtUtc: "2026-01-30T11:59:59Z",
          displayDate: "2026. 1. 30",
          timezone: "AoE (-12:00)",
          status: "confirmed",
          track: "Main conference",
        },
      ],
    },
    {
      id: "asp-dac-2027",
      acronym: "ASP-DAC 2027",
      name: "Asia and South Pacific Design Automation Conference",
      year: 2027,
      location: "Tokyo, Japan",
      dateRange: "2027. 1. 18 - 2027. 1. 21",
      conferenceStart: "2027-01-18",
      conferenceEnd: "2027-01-21",
      officialUrl: "https://aspdac.com/2027",
      tier: "T2",
      categories: ["Circuit"],
      status: "confirmed",
      description: "Official schedule",
      registrySource: "curated",
      registrySourceUrl: "https://aspdac.com/2027",
      registryRecordId: null,
      deadlines: [
        {
          id: "asp-dac-2027-paper",
          label: "논문 제출",
          kind: "paper_submission",
          dueAtUtc: "2026-10-01T11:59:59Z",
          displayDate: "2026. 10. 1",
          timezone: "AoE (-12:00)",
          status: "confirmed",
          track: "Main conference",
        },
      ],
    },
  ],
  evidence: [],
  history: [],
}

const commandResponseSchema = z.object({
  response_type: z.enum(["ephemeral", "in_channel"]),
  text: z.string(),
})

const workerEnv = {
  MATTERMOST_COMMAND_TOKEN: "command-token",
  CATALOG_URL: "https://catalog.example/catalog-state.json",
}

function commandRequest(text: string, token = "command-token"): Request {
  return new Request("https://bot.example/mattermost/command", {
    method: "POST",
    headers: {
      authorization: `Token ${token}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ text }).toString(),
  })
}

test("Given a valid command, when DAC 일정 알려줘 is requested, then its schedule and official URL are returned", async () => {
  const app = createMattermostApp(async () => catalog)

  const response = await app.fetch(commandRequest("DAC 일정 알려줘"), workerEnv)
  const body = commandResponseSchema.parse(await response.json())

  expect(response.status).toBe(200)
  expect(body).toEqual({
    response_type: "in_channel",
    text: expect.stringContaining("#### DAC 2026"),
  })
  expect(body.text).toContain("논문 제출")
  expect(body.text).toContain("2026. 1. 30")
  expect(body.text).toContain("https://dac.com/2026")
})

test("Given an invalid Mattermost token, when a command arrives, then it is rejected before loading the catalog", async () => {
  let catalogLoadCount = 0
  const app = createMattermostApp(async () => {
    catalogLoadCount += 1
    return catalog
  })

  const response = await app.fetch(commandRequest("DAC", "wrong-token"), workerEnv)

  expect(response.status).toBe(401)
  expect(catalogLoadCount).toBe(0)
})

test("Given an unmatched conference name, when a valid command is requested, then an ephemeral search hint is returned", async () => {
  const app = createMattermostApp(async () => catalog)

  const response = await app.fetch(commandRequest("UnknownConf 일정 알려줘"), workerEnv)
  const body = commandResponseSchema.parse(await response.json())

  expect(response.status).toBe(200)
  expect(body.response_type).toBe("ephemeral")
  expect(body.text).toContain("찾지 못했습니다")
})
