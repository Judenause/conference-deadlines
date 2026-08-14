import { expect, test } from "@playwright/test"

test("search, calendar, evidence, history, and empty states work without overflow", async ({
  page,
}, testInfo) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "학회 마감 일정" })).toBeVisible()

  await page.keyboard.press("ControlOrMeta+K")
  await expect(page.getByRole("searchbox")).toBeFocused()
  await page.screenshot({
    fullPage: true,
    path: `../../.omo/evidence/browser/${testInfo.project.name}-focus.png`,
  })

  const width = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }))
  expect(width.scroll).toBeLessThanOrEqual(width.client)

  await page.getByRole("tab", { name: "목록" }).focus()
  await page.keyboard.press("ArrowRight")
  await expect(page.getByRole("tab", { name: "캘린더" })).toBeFocused()
  await expect(page.locator(".calendar-view")).toContainText("2026년 3월")
  await page.screenshot({
    fullPage: true,
    path: `../../.omo/evidence/browser/${testInfo.project.name}-calendar.png`,
  })
  await page.keyboard.press("ArrowLeft")
  await page.getByRole("searchbox").fill("CUI")
  await page.getByRole("button", { name: "CUI 2026 상세 보기" }).click()
  await expect(page.getByRole("heading", { name: "주요 마감" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "근거 보기" })).toBeVisible()
  await expect(page.getByText("논문 제출 마감 연장")).toBeVisible()
  if (testInfo.project.name !== "desktop-1280") {
    await expect(page.getByLabel("선택한 학회의 근거와 변경 이력")).toHaveCSS(
      "transform",
      "matrix(1, 0, 0, 1, 0, 0)",
    )
  }

  await page.screenshot({
    fullPage: true,
    path: `../../.omo/evidence/browser/${testInfo.project.name}.png`,
  })

  if (testInfo.project.name === "mobile-375") {
    await page.getByRole("heading", { name: "변경 이력" }).scrollIntoViewIfNeeded()
    await page.screenshot({
      path: "../../.omo/evidence/browser/mobile-375-history.png",
    })
  }
  if (testInfo.project.name !== "desktop-1280") {
    await page.keyboard.press("Escape")
    await expect(
      page.getByRole("dialog", { name: "선택한 학회의 근거와 변경 이력" }),
    ).not.toBeVisible()
    await expect
      .poll(async () => {
        const left = await page
          .locator(".evidence-panel")
          .evaluate((element) => element.getBoundingClientRect().left)
        return left >= (await page.evaluate(() => window.innerWidth))
      })
      .toBe(true)
  }
  await page.getByRole("searchbox").fill("없는학회")
  await expect(page.getByText("검색 결과가 없습니다")).toBeVisible()
  await page.screenshot({
    fullPage: true,
    path: `../../.omo/evidence/browser/${testInfo.project.name}-empty.png`,
  })

  await page.emulateMedia({ reducedMotion: "reduce" })
  expect(
    await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches),
  ).toBe(true)
})
