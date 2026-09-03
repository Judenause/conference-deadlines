import {
  type ConferenceRequestInput,
  conferenceRequestInputSchema,
  managementRequestStatusSchema,
  type ScheduleOverrideInput,
  scheduleOverrideInputSchema,
} from "@conf/contracts"
import { z } from "zod"

export interface ManagementApiConfig {
  readonly apiUrl: string
}

export interface ManagementAdminSession {
  readonly username: string
  readonly expiresAt: string
}

export interface ManagementRequestSummary {
  readonly id: string
  readonly kind: "conference" | "schedule-override"
  readonly title: string
  readonly status: "submitted" | "approved" | "rejected" | "imported"
  readonly submittedBy: string
  readonly submittedAt: string
}

const sessionSchema = z.object({
  username: z.string().min(3).max(64),
  expiresAt: z.string().datetime(),
})
const requestMetadataSchema = z.object({
  id: z.string().uuid(),
  status: managementRequestStatusSchema,
  submittedBy: z.string().min(1),
  submittedAt: z.string().datetime(),
})
const conferenceRequestListSchema = z.object({
  items: z.array(requestMetadataSchema.extend({ name: z.string().min(1) })),
})
const scheduleOverrideListSchema = z.object({
  items: z.array(
    requestMetadataSchema.extend({ editionId: z.string().min(1), value: z.string().min(1) }),
  ),
})

function environmentValue(key: string): string | undefined {
  const value = import.meta.env[key]
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

export function getManagementApiConfig(): ManagementApiConfig | undefined {
  const apiUrl = environmentValue("VITE_MANAGEMENT_API_URL")
  if (!apiUrl) return undefined
  return { apiUrl: new URL(apiUrl).origin }
}

function endpoint(config: ManagementApiConfig, path: string): string {
  return new URL(path, config.apiUrl).href
}

async function request(
  config: ManagementApiConfig,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(endpoint(config, path), { ...init, credentials: "include" })
  if (!response.ok) {
    if (response.status === 401) throw new Error("관리자 로그인이 필요합니다.")
    throw new Error("관리 서버 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.")
  }
  return response
}

export async function getManagementAdminSession(
  config: ManagementApiConfig,
): Promise<ManagementAdminSession | undefined> {
  const response = await fetch(endpoint(config, "/api/v1/admin/session"), {
    credentials: "include",
  })
  if (response.status === 401) return undefined
  if (!response.ok) throw new Error("관리 서버에 연결하지 못했습니다.")
  return sessionSchema.parse(await response.json())
}

export async function signInManagementAdmin(
  config: ManagementApiConfig,
  username: string,
  password: string,
): Promise<ManagementAdminSession> {
  const response = await request(config, "/api/v1/admin/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  return sessionSchema.parse(await response.json())
}

export async function submitConferenceRequest(
  config: ManagementApiConfig,
  input: ConferenceRequestInput,
): Promise<void> {
  const parsed = conferenceRequestInputSchema.parse(input)
  await request(config, "/api/v1/admin/conference-requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(parsed),
  })
}

export async function submitScheduleOverride(
  config: ManagementApiConfig,
  input: ScheduleOverrideInput,
): Promise<void> {
  const parsed = scheduleOverrideInputSchema.parse(input)
  await request(config, "/api/v1/admin/schedule-overrides", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(parsed),
  })
}

export async function getManagementRequests(
  config: ManagementApiConfig,
): Promise<readonly ManagementRequestSummary[]> {
  const [conferenceResponse, overrideResponse] = await Promise.all([
    request(config, "/api/v1/admin/conference-requests"),
    request(config, "/api/v1/admin/schedule-overrides"),
  ])
  const conferences = conferenceRequestListSchema.parse(await conferenceResponse.json()).items.map(
    (request): ManagementRequestSummary => ({
      id: request.id,
      kind: "conference",
      title: request.name,
      status: request.status,
      submittedBy: request.submittedBy,
      submittedAt: request.submittedAt,
    }),
  )
  const overrides = scheduleOverrideListSchema.parse(await overrideResponse.json()).items.map(
    (request): ManagementRequestSummary => ({
      id: request.id,
      kind: "schedule-override",
      title: `${request.editionId} · ${request.value}`,
      status: request.status,
      submittedBy: request.submittedBy,
      submittedAt: request.submittedAt,
    }),
  )
  return [...conferences, ...overrides].sort((left, right) =>
    right.submittedAt.localeCompare(left.submittedAt),
  )
}

export async function reviewManagementRequest(
  config: ManagementApiConfig,
  item: Pick<ManagementRequestSummary, "id" | "kind">,
  status: "approved" | "rejected",
): Promise<void> {
  await request(config, `/api/v1/admin/requests/${item.kind}/${item.id}/review`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status, note: "" }),
  })
}
