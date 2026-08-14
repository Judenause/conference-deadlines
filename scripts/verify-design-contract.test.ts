import { expect, test } from "bun:test"
import { verifyDesignContract } from "./verify-design-contract"

test("design contract contains the research, system, and accessibility gates", async () => {
  const designFile = Bun.file(new URL("../DESIGN.md", import.meta.url))

  expect(await designFile.exists()).toBe(true)

  expect(verifyDesignContract(await designFile.text())).toEqual({ ok: true })
})
