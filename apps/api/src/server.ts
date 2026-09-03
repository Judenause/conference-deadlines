import { createApp } from "./app"

const port = Number(Bun.env.PORT ?? 3001)
const managementSocket = Bun.env.MANAGEMENT_UNIX_SOCKET?.trim()
const app = createApp()

const loopbackServer = Bun.serve({ hostname: "127.0.0.1", port, fetch: app.fetch })
if (managementSocket) Bun.serve({ unix: managementSocket, fetch: app.fetch })

console.log(
  managementSocket
    ? `Conference API listening on http://${loopbackServer.hostname}:${loopbackServer.port} and unix://${managementSocket}`
    : `Conference API listening on http://${loopbackServer.hostname}:${loopbackServer.port}`,
)
