import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"
import "./styles/tokens.css"
import "./styles/app.css"
import "./styles/responsive.css"

if (import.meta.env.DEV) {
  void import("react-scan").then(({ scan }) => scan({ enabled: true }))
  void import("react-grab")
}

const root = document.getElementById("root")
if (!root) throw new Error("Root element is missing")
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
