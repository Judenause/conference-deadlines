import { createApp } from "./app"

const port = Number(Bun.env.PORT ?? 3001)
const managementSocket = Bun.env.MANAGEMENT_UNIX_SOCKET?.trim()

const server = managementSocket
  ? Bun.serve({ unix: managementSocket, fetch: createApp().fetch })
  : Bun.serve({ hostname: "127.0.0.1", port, fetch: createApp().fetch })

console.log(
  managementSocket
    ? `Conference API listening on unix://${managementSocket}`
    : `Conference API listening on http://${server.hostname}:${server.port}`,
)
