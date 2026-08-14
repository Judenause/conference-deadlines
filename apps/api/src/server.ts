import { createApp } from "./app"

const port = Number(Bun.env.PORT ?? 3001)

Bun.serve({
  port,
  fetch: createApp().fetch,
})

console.log(`Conference API listening on http://127.0.0.1:${port}`)
