import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const configuredBase = process.env.VITE_BASE_PATH ?? "/"
const base = configuredBase.endsWith("/") ? configuredBase : `${configuredBase}/`

export default defineConfig({
  base,
  plugins: [react()],
  publicDir: "../../data/seed",
  server: { proxy: { "/api": "http://127.0.0.1:3001" } },
  preview: {
    host: "127.0.0.1",
    port: 4189,
    strictPort: true,
    proxy: { "/api": "http://127.0.0.1:3091" },
  },
})
