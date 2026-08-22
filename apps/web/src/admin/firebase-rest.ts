import {
  type ConferenceRequestInput,
  conferenceRequestInputSchema,
  type ScheduleOverrideInput,
  scheduleOverrideInputSchema,
} from "@conf/contracts"
import { z } from "zod"

interface GoogleTokenResponse {
  readonly access_token: string
}

interface GoogleTokenClient {
  requestAccessToken(options: { readonly prompt: string }): void
}

interface GoogleIdentity {
  readonly accounts: {
    readonly oauth2: {
      initTokenClient(options: {
        readonly client_id: string
        readonly scope: string
        readonly callback: (response: GoogleTokenResponse) => void
        readonly error_callback: () => void
      }): GoogleTokenClient
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentity
  }
}

export interface FirebaseAdminConfig {
  readonly apiKey: string
  readonly projectId: string
  readonly googleClientId: string
}

export interface FirebaseAdminSession {
  readonly idToken: string
  readonly email: string
}

interface FirestoreValue {
  readonly stringValue?: string
  readonly nullValue?: null
}

const firebaseSignInResponseSchema = z.object({
  idToken: z.string().min(1),
  email: z.string().email(),
})

function environmentValue(key: string): string | undefined {
  const value = import.meta.env[key]
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

export function getFirebaseAdminConfig(): FirebaseAdminConfig | undefined {
  const apiKey = environmentValue("VITE_FIREBASE_API_KEY")
  const projectId = environmentValue("VITE_FIREBASE_PROJECT_ID")
  const googleClientId = environmentValue("VITE_GOOGLE_CLIENT_ID")
  if (!apiKey || !projectId || !googleClientId) return undefined
  return { apiKey, projectId, googleClientId }
}

function loadGoogleIdentity(): Promise<GoogleIdentity> {
  if (window.google) return Promise.resolve(window.google)
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    )
    const ready = () =>
      window.google
        ? resolve(window.google)
        : reject(new Error("Google 로그인 모듈을 시작하지 못했습니다."))
    if (existing) {
      existing.addEventListener("load", ready, { once: true })
      existing.addEventListener(
        "error",
        () => reject(new Error("Google 로그인 모듈을 불러오지 못했습니다.")),
        { once: true },
      )
      return
    }
    const script = document.createElement("script")
    script.async = true
    script.src = "https://accounts.google.com/gsi/client"
    script.addEventListener("load", ready, { once: true })
    script.addEventListener(
      "error",
      () => reject(new Error("Google 로그인 모듈을 불러오지 못했습니다.")),
      { once: true },
    )
    document.head.append(script)
  })
}

async function exchangeGoogleToken(
  config: FirebaseAdminConfig,
  accessToken: string,
): Promise<FirebaseAdminSession> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${encodeURIComponent(config.apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        postBody: `access_token=${encodeURIComponent(accessToken)}&providerId=google.com`,
        requestUri: window.location.origin,
        returnSecureToken: true,
      }),
    },
  )
  if (!response.ok) throw new Error("Firebase 로그인에 실패했습니다. 관리자 권한을 확인해 주세요.")
  return firebaseSignInResponseSchema.parse(await response.json())
}

export async function signInFirebaseAdmin(
  config: FirebaseAdminConfig,
): Promise<FirebaseAdminSession> {
  const google = await loadGoogleIdentity()
  const accessToken = await new Promise<string>((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: config.googleClientId,
      scope: "openid email profile",
      callback: (response) => resolve(response.access_token),
      error_callback: () => reject(new Error("Google 로그인 창을 완료하지 못했습니다.")),
    })
    client.requestAccessToken({ prompt: "select_account" })
  })
  return exchangeGoogleToken(config, accessToken)
}

function stringFields(
  values: Readonly<Record<string, string | null>>,
): Record<string, FirestoreValue> {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) =>
      value === null ? [key, { nullValue: null }] : [key, { stringValue: value }],
    ),
  )
}

async function writeDocument(
  config: FirebaseAdminConfig,
  session: FirebaseAdminSession,
  collection: "conferenceRequests" | "scheduleOverrides",
  fields: Readonly<Record<string, string | null>>,
): Promise<void> {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/(default)/documents/${collection}`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${session.idToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ fields: stringFields(fields) }),
    },
  )
  if (response.status === 401 || response.status === 403)
    throw new Error("Firebase 관리자 권한이 없습니다. adminUsers 문서를 확인해 주세요.")
  if (!response.ok) throw new Error("관리 요청을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.")
}

export async function submitConferenceRequest(
  config: FirebaseAdminConfig,
  session: FirebaseAdminSession,
  input: ConferenceRequestInput,
): Promise<void> {
  const parsed = conferenceRequestInputSchema.parse(input)
  await writeDocument(config, session, "conferenceRequests", {
    ...parsed,
    submittedBy: session.email,
    submittedAt: new Date().toISOString(),
    status: "submitted",
  })
}

export async function submitScheduleOverride(
  config: FirebaseAdminConfig,
  session: FirebaseAdminSession,
  input: ScheduleOverrideInput,
): Promise<void> {
  const parsed = scheduleOverrideInputSchema.parse(input)
  await writeDocument(config, session, "scheduleOverrides", {
    ...parsed,
    submittedBy: session.email,
    submittedAt: new Date().toISOString(),
    status: "submitted",
  })
}
