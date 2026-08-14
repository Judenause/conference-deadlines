import { expect, test } from "bun:test"

const workspacePaths = [
  "apps/api",
  "apps/web",
  "packages/contracts",
  "packages/crawler",
  "packages/domain",
  "packages/storage",
] as const

const requiredScripts = ["dev", "typecheck", "lint", "test", "build", "doctor", "e2e"] as const

test("root manifest declares the complete Bun workspace", async () => {
  const manifestFile = Bun.file(new URL("../package.json", import.meta.url))
  expect(await manifestFile.exists()).toBe(true)

  const manifest: unknown = await manifestFile.json()
  expect(manifest).toMatchObject({
    private: true,
    packageManager: "bun@1.3.14",
    workspaces: ["apps/*", "packages/*"],
  })

  const scripts =
    (manifest as { readonly scripts?: Readonly<Record<string, string>> }).scripts ?? {}
  for (const script of requiredScripts) expect(scripts[script]).toBeString()

  for (const path of workspacePaths) {
    expect(await Bun.file(new URL(`../${path}/package.json`, import.meta.url)).exists()).toBe(true)
  }
})

test("TypeScript base config locks the safety flags", async () => {
  const config: unknown = await Bun.file(new URL("../tsconfig.base.json", import.meta.url)).json()
  expect(config).toMatchObject({
    compilerOptions: {
      strict: true,
      noUncheckedIndexedAccess: true,
      exactOptionalPropertyTypes: true,
      verbatimModuleSyntax: true,
    },
  })
})
