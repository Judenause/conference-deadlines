function base64url(value: Uint8Array | string): string {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value
  return Buffer.from(bytes).toString("base64url")
}

function pemToBytes(value: string): Uint8Array {
  const body = value.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "")
  return new Uint8Array(Buffer.from(body, "base64"))
}

function asArrayBuffer(value: Uint8Array): ArrayBuffer {
  return Uint8Array.from(value).buffer as ArrayBuffer
}

export interface GitHubAppConfig {
  readonly appId: string
  readonly installationId: string
  readonly privateKey: string
  readonly repository: string
}

export function readGitHubAppConfig(
  environment: Record<string, string | undefined> = Bun.env,
): GitHubAppConfig | undefined {
  const appId = environment.GITHUB_APP_ID?.trim()
  const installationId = environment.GITHUB_APP_INSTALLATION_ID?.trim()
  const privateKey = environment.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n").trim()
  const repository = environment.GITHUB_REPOSITORY?.trim() ?? "SKKU-IRIS-Lab/conference-deadlines"
  if (!appId || !installationId || !privateKey) return undefined
  if (
    !/^[-\d]+$/.test(appId) ||
    !/^\d+$/.test(installationId) ||
    !/^[\w.-]+\/[\w.-]+$/.test(repository)
  )
    throw new Error("GitHub App 환경 변수 형식이 올바르지 않습니다.")
  return { appId, installationId, privateKey, repository }
}

async function appJwt(config: GitHubAppConfig): Promise<string> {
  const now = Math.floor(Date.now() / 1_000)
  const encodedHeader = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const encodedPayload = base64url(
    JSON.stringify({ iat: now - 60, exp: now + 540, iss: config.appId }),
  )
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const key = await crypto.subtle.importKey(
    "pkcs8",
    asArrayBuffer(pemToBytes(config.privateKey)),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  )
  return `${signingInput}.${base64url(new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, asArrayBuffer(new TextEncoder().encode(signingInput)))))}`
}

export async function dispatchWeeklySourceMonitor(config: GitHubAppConfig): Promise<void> {
  const tokenResponse = await fetch(
    `https://api.github.com/app/installations/${encodeURIComponent(config.installationId)}/access_tokens`,
    {
      method: "POST",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${await appJwt(config)}`,
        "x-github-api-version": "2022-11-28",
      },
    },
  )
  if (!tokenResponse.ok) throw new Error("GitHub App 설치 토큰을 만들지 못했습니다.")
  const { token } = (await tokenResponse.json()) as { token?: unknown }
  if (typeof token !== "string" || !token)
    throw new Error("GitHub App 설치 토큰 응답이 올바르지 않습니다.")
  const response = await fetch(
    `https://api.github.com/repos/${config.repository}/actions/workflows/monthly-source-monitor.yml/dispatches`,
    {
      method: "POST",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        "x-github-api-version": "2022-11-28",
      },
      body: JSON.stringify({ ref: "main" }),
    },
  )
  if (!response.ok) throw new Error("GitHub 검수 workflow를 시작하지 못했습니다.")
}
