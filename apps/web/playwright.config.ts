import { defineConfig } from "@playwright/test"

const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:4189",
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile-375", use: { viewport: { width: 375, height: 812 } } },
    { name: "tablet-768", use: { viewport: { width: 768, height: 900 } } },
    { name: "desktop-1280", use: { viewport: { width: 1280, height: 900 } } },
  ],
  webServer: [
    {
      command: "PORT=3091 bun ../../apps/api/src/server.ts",
      url: "http://127.0.0.1:3091/api/v1/health",
      reuseExistingServer: false,
    },
    {
      command: "bun run build && bun run preview",
      url: "http://127.0.0.1:4189",
      reuseExistingServer: false,
    },
  ],
})
