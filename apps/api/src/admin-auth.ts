import { z } from "zod"
import type { AdminSession, ManagementStore } from "./management-store"

const tokenResponseSchema = z.object({ id_token: z.string().min(1) })
const tokenInfoSchema = z.object({
  aud: z.string().min(1),
  email: z.string().email(),
  email_verified: z.union([z.literal("true"), z.literal(true)]),
  exp: z.string().regex(/^\d+$/),
  iss: z.enum(["accounts.google.com", "https://accounts.google.com"]),
})

const sessionDurationMs = 8 * 60 * 60 * 1_000
const authFlowDurationMs = 10 * 60 * 1_000

export interface ManagementAuthConfig {
  readonly googleClientId: string
  readonly googleClientSecret: string
  readonly publicUrl: string
  readonly publicWebOrigin: string
  readonly adminEmails: ReadonlySet<string>
  readonly secureCookies: boolean
}

export function readManagementAuthConfig(
  environment: Record<string, string | undefined> = Bun.env,
): ManagementAuthConfig | undefined {
  const googleClientId = environment.GOOGLE_CLIENT_ID?.trim()
  const googleClientSecret = environment.GOOGLE_CLIENT_SECRET?.trim()
  const publicUrl = environment.MANAGEMENT_PUBLIC_URL?.trim()
  const publicWebOrigin = environment.MANAGEMENT_WEB_ORIGIN?.trim()
  const adminEmails = environment.MANAGEMENT_ADMIN_EMAILS?.split(",")
    .map((email) => email.trim().toLocaleLowerCase("en-US"))
    .filter(Boolean)
  if (
    !googleClientId ||
    !googleClientSecret ||
    !publicUrl ||
    !publicWebOrigin ||
    !adminEmails?.length
  )
    return undefined
  const parsedPublicUrl = new URL(publicUrl)
  const parsedWebOrigin = new URL(publicWebOrigin)
  return {
    googleClientId,
    googleClientSecret,
    publicUrl: parsedPublicUrl.origin,
    publicWebOrigin: parsedWebOrigin.origin,
    adminEmails: new Set(adminEmails),
    secureCookies: parsedPublicUrl.protocol === "https:",
  }
}

function encode(value: Uint8Array): string {
  return Buffer.from(value).toString("base64url")
}

function randomToken(): string {
  return encode(crypto.getRandomValues(new Uint8Array(32)))
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return encode(new Uint8Array(digest))
}

function expiry(milliseconds: number): string {
  return new Date(Date.now() + milliseconds).toISOString()
}

function callbackUrl(config: ManagementAuthConfig): string {
  return `${config.publicUrl}/api/v1/admin/auth/google/callback`
}

export async function createGoogleAuthorizationUrl(
  store: ManagementStore,
  config: ManagementAuthConfig,
  returnTo: string | undefined,
): Promise<string> {
  const safeReturnTo = new URL(returnTo ?? config.publicWebOrigin)
  if (safeReturnTo.origin !== config.publicWebOrigin)
    throw new Error("허용되지 않은 복귀 주소입니다.")
  const state = randomToken()
  const codeVerifier = randomToken()
  const authorization = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authorization.searchParams.set("client_id", config.googleClientId)
  authorization.searchParams.set("redirect_uri", callbackUrl(config))
  authorization.searchParams.set("response_type", "code")
  authorization.searchParams.set("scope", "openid email profile")
  authorization.searchParams.set("state", state)
  authorization.searchParams.set("code_challenge", await sha256(codeVerifier))
  authorization.searchParams.set("code_challenge_method", "S256")
  authorization.searchParams.set("prompt", "select_account")
  store.saveOAuthFlow({
    state,
    codeVerifier,
    returnTo: safeReturnTo.href,
    expiresAt: expiry(authFlowDurationMs),
  })
  return authorization.href
}

export async function exchangeGoogleAuthorizationCode(
  store: ManagementStore,
  config: ManagementAuthConfig,
  state: string | undefined,
  code: string | undefined,
): Promise<{
  readonly sessionToken: string
  readonly returnTo: string
  readonly session: AdminSession
}> {
  if (!state || !code) throw new Error("Google 로그인 응답이 완전하지 않습니다.")
  const flow = store.takeOAuthFlow(state)
  if (!flow) throw new Error("로그인 요청이 만료되었거나 이미 사용되었습니다.")
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: callbackUrl(config),
      grant_type: "authorization_code",
      code_verifier: flow.codeVerifier,
    }),
  })
  if (!tokenResponse.ok) throw new Error("Google 로그인 토큰을 받지 못했습니다.")
  const { id_token: idToken } = tokenResponseSchema.parse(await tokenResponse.json())
  const verified = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  )
  if (!verified.ok) throw new Error("Google 로그인 토큰을 검증하지 못했습니다.")
  const claims = tokenInfoSchema.parse(await verified.json())
  if (claims.aud !== config.googleClientId || Number(claims.exp) * 1_000 <= Date.now())
    throw new Error("Google 로그인 토큰의 대상 또는 만료 시간이 올바르지 않습니다.")
  const email = claims.email.toLocaleLowerCase("en-US")
  if (!config.adminEmails.has(email)) throw new Error("관리자 권한이 없는 Google 계정입니다.")
  const sessionToken = randomToken()
  const session = { email, expiresAt: expiry(sessionDurationMs) }
  store.saveSession(await sha256(sessionToken), session)
  return { sessionToken, returnTo: flow.returnTo, session }
}

export async function getSession(
  store: ManagementStore,
  sessionToken: string | undefined,
): Promise<AdminSession | undefined> {
  return sessionToken ? store.getSession(await sha256(sessionToken)) : undefined
}

export async function deleteSession(
  store: ManagementStore,
  sessionToken: string | undefined,
): Promise<void> {
  if (sessionToken) store.deleteSession(await sha256(sessionToken))
}

export function sessionCookie(
  token: string,
  config: ManagementAuthConfig,
  maxAgeSeconds = sessionDurationMs / 1_000,
): string {
  return [
    `conference_admin_session=${token}`,
    "Path=/api/v1/admin",
    "HttpOnly",
    config.secureCookies ? "Secure" : undefined,
    config.secureCookies ? "SameSite=None" : "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ]
    .filter(Boolean)
    .join("; ")
}

export function readCookie(request: Request, name: string): string | undefined {
  const value = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim().split("=", 2))
    .find(([key]) => key === name)?.[1]
  return value?.trim() || undefined
}
