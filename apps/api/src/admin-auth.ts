import type { AdminSession, ManagementStore } from "./management-store"

const sessionDurationMs = 8 * 60 * 60 * 1_000

export interface ManagementAuthConfig {
  readonly publicUrl: string
  readonly publicWebOrigin: string
  readonly initialAdminUsername: string
  readonly initialAdminPasswordHash: string
  readonly secureCookies: boolean
}

export function readManagementAuthConfig(
  environment: Record<string, string | undefined> = Bun.env,
): ManagementAuthConfig | undefined {
  const publicUrl = environment.MANAGEMENT_PUBLIC_URL?.trim()
  const publicWebOrigin = environment.MANAGEMENT_WEB_ORIGIN?.trim()
  const initialAdminUsername = environment.MANAGEMENT_ADMIN_USERNAME?.trim()
  const initialAdminPasswordHash = environment.MANAGEMENT_ADMIN_PASSWORD_HASH?.trim()
  if (!publicUrl || !publicWebOrigin || !initialAdminUsername || !initialAdminPasswordHash)
    return undefined
  const parsedPublicUrl = new URL(publicUrl)
  const parsedWebOrigin = new URL(publicWebOrigin)
  if (!/^[a-z0-9][a-z0-9_-]{2,63}$/i.test(initialAdminUsername))
    throw new Error("MANAGEMENT_ADMIN_USERNAME 형식이 올바르지 않습니다.")
  if (!initialAdminPasswordHash.startsWith("$argon2id$"))
    throw new Error("MANAGEMENT_ADMIN_PASSWORD_HASH는 Argon2id 해시여야 합니다.")
  return {
    publicUrl: parsedPublicUrl.origin,
    publicWebOrigin: parsedWebOrigin.origin,
    initialAdminUsername,
    initialAdminPasswordHash,
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

function expiry(): string {
  return new Date(Date.now() + sessionDurationMs).toISOString()
}

export async function authenticateLocalAdmin(
  store: ManagementStore,
  username: string,
  password: string,
): Promise<{ readonly sessionToken: string; readonly session: AdminSession } | undefined> {
  const passwordHash = store.getAdminPasswordHash(username)
  if (!passwordHash || !(await Bun.password.verify(password, passwordHash))) return undefined
  const sessionToken = randomToken()
  const session = { username, expiresAt: expiry() }
  store.saveSession(await sha256(sessionToken), session)
  return { sessionToken, session }
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
