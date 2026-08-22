import { catalogSchema } from "@conf/contracts"
import { crawlFixture, crawlLive } from "./crawl"
import { auditFutureEditionSchedules, formatScheduleAuditReport } from "./schedule-audit"
import { runSourceMonitor, writeMonitorReview } from "./source-monitor"

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  if (args[0] === "monitor") {
    const catalog = catalogSchema.parse(await Bun.file("data/seed/catalog-state.json").json())
    const run = await runSourceMonitor(
      "data/seed/catalog-state.json",
      "data/monitor/source-state.json",
    )
    const findings = auditFutureEditionSchedules(catalog)
    if (run.changes.length > 0 || findings.length > 0) {
      await writeMonitorReview(
        "data/monitor/source-state.json",
        "data/monitor/monthly-review.md",
        run,
      )
      await Bun.write(
        "data/monitor/future-edition-safety-review.md",
        `${formatScheduleAuditReport(findings)}\n`,
      )
    }
    console.log(
      JSON.stringify(
        {
          sourceCount: run.sources.length,
          changeCount: run.changes.length,
          staleFutureScheduleCount: findings.length,
        },
        null,
      ),
    )
    return
  }
  if (args[0] !== "crawl")
    throw new Error("사용법: crawl --source <registered-id> [--live] | monitor")
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
