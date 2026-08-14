export const REQUIRED_DESIGN_SECTIONS = [
  "## 0. Research Log",
  "## 1. Atmosphere & Identity",
  "## 2. Color",
  "## 3. Typography",
  "## 4. Spacing & Layout",
  "## 5. Components",
  "## 6. Motion & Interaction",
  "## 7. Depth & Surface",
  "## 8. Accessibility Constraints & Accepted Debt",
] as const

export const REQUIRED_DESIGN_MARKERS = [
  "--focus-ring",
  "375px",
  "768px",
  "1280px",
  "200% zoom",
  "reduced motion",
  "Korean graduate researcher",
  "lab manager",
  "low-vision keyboard researcher",
  "Design variance: 5",
  "Motion intensity: 3",
  "Visual density: 6",
  "| None | None | No accepted debt | Closed |",
] as const

export type DesignContractResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly missing: readonly string[] }

export function verifyDesignContract(contract: string): DesignContractResult {
  const requirements = [...REQUIRED_DESIGN_SECTIONS, ...REQUIRED_DESIGN_MARKERS]
  const missing = requirements.filter((requirement) => !contract.includes(requirement))
  return missing.length === 0 ? { ok: true } : { ok: false, missing }
}

async function main(): Promise<void> {
  const designFile = Bun.file(new URL("../DESIGN.md", import.meta.url))
  if (!(await designFile.exists())) {
    console.error("DESIGN.md is missing")
    process.exitCode = 1
    return
  }

  const result = verifyDesignContract(await designFile.text())
  if (!result.ok) {
    console.error(`Design contract missing: ${result.missing.join(", ")}`)
    process.exitCode = 1
    return
  }

  console.log(
    "Design contract complete: 9 sections, 3 personas, 3 responsive widths, 0 accepted debt",
  )
}

if (import.meta.main) {
  await main()
}
