import { expect, test } from "bun:test"
import { resolveRegisteredSource } from "./source-registry"

test("registered source resolves to its exact HTTPS host", () => {
  expect(resolveRegisteredSource("cui-2026-official")).toMatchObject({
    canonicalUrl: "https://cui.acm.org/2026/submission/",
    allowedHosts: ["cui.acm.org"],
  })
})

test("arbitrary URL input is rejected", () => {
  expect(() => resolveRegisteredSource("https://127.0.0.1/private")).toThrow("등록되지 않은 소스")
})
