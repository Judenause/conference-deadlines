import { crawlFixture, crawlLive } from "./crawl"

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  if (args[0] !== "crawl") throw new Error("사용법: crawl --source <registered-id> [--live]")
  const sourceIndex = args.indexOf("--source")
  const sourceId = sourceIndex >= 0 ? args[sourceIndex + 1] : undefined
  if (!sourceId) throw new Error("--source에는 등록된 소스 ID가 필요합니다.")
  const result = args.includes("--live") ? await crawlLive(sourceId) : await crawlFixture(sourceId)
  console.log(JSON.stringify(result, null, 2))
}

if (import.meta.main) {
  await main().catch((reason: unknown) => {
    console.error(
      reason instanceof Error ? reason.message : "수집 중 알 수 없는 오류가 발생했습니다.",
    )
    process.exitCode = 1
  })
}
