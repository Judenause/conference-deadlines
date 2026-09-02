import { createMattermostApp, type MattermostWorkerEnv } from "./app"

const app = createMattermostApp()

export default {
  async fetch(request: Request, env: MattermostWorkerEnv): Promise<Response> {
    return await app.fetch(request, env)
  },
}
