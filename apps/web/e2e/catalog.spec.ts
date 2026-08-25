import { expect, test } from "@playwright/test"

test("search, calendar, evidence, history, and empty states work without overflow", async ({
  page,
}, testInfo) => {
  await page.clock.install({ time: new Date("2026-08-19T12:00:00Z") })
  await page.goto("/")
  await expect(page.getByRole("searchbox")).toBeVisible()
  await expect(page.getByText("수집 원칙")).toHaveCount(0)
  await expect(page.getByRole("tab", { name: "타임라인" })).toHaveAttribute("aria-selected", "true")
  await expect(page.getByRole("region", { name: "월별 학회 타임라인" })).toBeVisible()
  const productActions = page.locator(".product-header__actions")
  await expect(productActions.getByRole("tablist", { name: "보기 방식" })).toBeVisible()
  await expect(productActions.getByRole("group", { name: "분야 필터" })).toBeVisible()
  await expect(page.locator(".hero .filter-scroll")).toHaveCount(0)
  for (const [label, tone, titleColor] of [
    ["Circuit", "circuit", "rgb(154, 90, 0)"],
    ["AI", "ai", "rgb(78, 93, 199)"],
    ["System", "system", "rgb(8, 122, 120)"],
    ["Archi", "archi", "rgb(54, 108, 175)"],
    ["CV", "cv", "rgb(177, 62, 104)"],
  ] as const) {
    await expect(page.getByRole("button", { name: label, exact: true })).toHaveAttribute(
      "data-category-tone",
      tone,
    )
    await expect(
      page.locator(`.timeline-board__row[data-category-tone="${tone}"]`).first(),
    ).toBeAttached()
    await expect(
      page
        .locator(`.timeline-board__row[data-category-tone="${tone}"]`)
        .first()
        .locator(".timeline-board__identity button strong"),
    ).toHaveCSS("color", titleColor)
  }
  await page.getByRole("button", { name: "전체", exact: true }).scrollIntoViewIfNeeded()
  await expect(page.getByRole("link", { name: "GitHub" })).toHaveCount(0)
  const timelineFieldColors = await page
    .locator(".timeline-board__row[data-category-tone]")
    .evaluateAll((rows) => [
      ...new Set(rows.map((row) => getComputedStyle(row).getPropertyValue("--category-accent"))),
    ])
  expect(timelineFieldColors).toHaveLength(5)
  for (const tone of ["circuit", "ai", "system", "archi", "cv"] as const) {
    const categoryRow = page
      .locator(`.timeline-board__row[data-category-tone="${tone}"]`)
      .filter({ has: page.locator(".timeline-board__deadline, .timeline-board__conference") })
      .first()
    await expect(categoryRow).toBeAttached()
    await categoryRow.screenshot({
      path: `../../.omo/evidence/browser/${testInfo.project.name}-category-${tone}.png`,
    })
  }
  if (testInfo.project.name !== "mobile-375") {
    await page.getByRole("link", { name: "Calendar" }).click()
    await expect(page.getByRole("tab", { name: "캘린더" })).toHaveAttribute("aria-selected", "true")
    await page.getByRole("link", { name: "Timeline", exact: true }).click()
    await expect(page.getByRole("tab", { name: "타임라인" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
  }
  if (testInfo.project.name === "desktop-1280") {
    await expect(page.getByLabel("선택한 학회의 근거와 변경 이력")).not.toBeVisible()
  }

  const themeToggle = page.locator(".theme-toggle:visible")
  await expect(themeToggle).toHaveAccessibleName("다크 모드로 전환")
  await themeToggle.click()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("conference-atlas-theme")))
    .toBe("dark")
  await page.screenshot({
    fullPage: false,
    path: `../../.omo/evidence/browser/${testInfo.project.name}-dark.png`,
  })
  await themeToggle.click()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light")
  await page.getByRole("tab", { name: "목록" }).click()

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
  await page.locator(".conference-card").first().scrollIntoViewIfNeeded()
  await page.screenshot({
    fullPage: false,
    path: `../../.omo/evidence/browser/${testInfo.project.name}-list.png`,
  })

  await page.getByRole("searchbox").fill("ICASSP 2026")
  await expect(page.getByText("검색 결과가 없습니다")).toBeVisible()
  await page.getByRole("searchbox").fill("ICECS 2026")
  await expect(page.getByRole("button", { name: "ICECS 2026 상세 보기" })).toBeVisible()
  await expect(page.getByText("2026. 6. 15", { exact: true })).not.toBeVisible()
  await expect(page.getByText("최종본 제출", { exact: true })).toBeVisible()
  await expect(page.getByText("2026. 11. 8 - 11. 11")).toBeVisible()
  await page.getByRole("searchbox").fill("ECAI 2026")
  await expect(page.getByText("학회 진행 중", { exact: true })).toBeVisible()
  await expect(page.getByText("오늘 진행 중", { exact: true })).toBeVisible()
  await expect(page.getByText("2026. 8. 18 - 8. 21", { exact: true })).not.toBeVisible()
  await page.getByRole("searchbox").fill("")

  await page.getByRole("tab", { name: "목록" }).focus()
  await page.keyboard.press("ArrowLeft")
  await expect(page.getByRole("tab", { name: "타임라인" })).toBeFocused()
  await expect(page.getByRole("region", { name: "월별 학회 타임라인" })).toBeVisible()
  await expect(page.getByText("제출일 · 학회 기간 타임라인")).toBeVisible()
  await expect(page.getByRole("link", { name: /공식 사이트 열기/ }).first()).toBeVisible()
  await page.locator(".timeline-board__axis").scrollIntoViewIfNeeded()
  await page.locator(".timeline-board__row").first().scrollIntoViewIfNeeded()
  await page.screenshot({
    fullPage: false,
    path: `../../.omo/evidence/browser/${testInfo.project.name}-timeline.png`,
  })
  await page.getByRole("searchbox").fill("MICRO 2026")
  await expect(page.locator(".timeline-board__deadline")).toBeVisible()
  await expect(page.locator(".timeline-board__conference")).toBeVisible()
  await page.locator(".timeline-board__row").scrollIntoViewIfNeeded()
  await page.evaluate(() => {
    const viewport = document.querySelector(".timeline-board__viewport")
    const marker = document.querySelector(".timeline-board__deadline")
    const identity = document.querySelector(".timeline-board__identity")
    if (!(viewport instanceof HTMLElement)) return
    if (!(marker instanceof HTMLElement)) return
    if (!(identity instanceof HTMLElement)) return
    viewport.scrollLeft = marker.offsetLeft - (viewport.clientWidth - identity.offsetWidth) / 2
  })
  await page.locator(".timeline-board__deadline").focus()
  await expect(page.locator(".timeline-board__deadline")).toBeFocused()
  await page.screenshot({
    fullPage: false,
    path: `../../.omo/evidence/browser/${testInfo.project.name}-timeline-focused.png`,
  })
  await page.getByRole("searchbox").fill("")
  await page.getByRole("tab", { name: "타임라인" }).focus()
  await page.keyboard.press("ArrowLeft")
  await expect(page.getByRole("tab", { name: "캘린더" })).toBeFocused()
  if (testInfo.project.name === "mobile-375") {
    await expect(page.getByRole("heading", { name: "2026년 9월" })).toBeVisible()
  } else {
    await expect(
      page.getByRole("table", { name: "2026년 9월 제출 및 학회 개최 일정" }),
    ).toBeVisible()
  }
  await page.getByRole("searchbox").fill("ECAI 2026")
  const ongoingConference = page.getByRole("button", {
    name: /ECAI 2026 학회 진행 중 상세 보기/,
  })
  await expect(ongoingConference).toBeVisible()
  await expect(page.getByText("2026. 8. 18 - 8. 21", { exact: true })).not.toBeVisible()
  await expect(ongoingConference.getByText("학회 진행 중", { exact: true })).toBeVisible()
  await expect(ongoingConference.getByText("오늘 진행 중", { exact: true })).toBeVisible()
  await ongoingConference.scrollIntoViewIfNeeded()
  await page.locator(".filter-scroll").evaluate((element) => {
    element.scrollLeft = 0
  })
  await page.screenshot({
    fullPage: false,
    path: `../../.omo/evidence/browser/${testInfo.project.name}-calendar.png`,
  })
  await page.getByRole("searchbox").fill("")
  await expect(
    page
      .getByRole("link", {
        name: "MICRO 2026 공식 사이트 열기: https://www.microarch.org/micro59/",
      })
      .first(),
  ).toBeVisible()
  await page.getByRole("tab", { name: "목록" }).click()
  await page.getByRole("searchbox").fill("MICRO")
  await expect(
    page
      .getByRole("link", {
        name: "MICRO 2026 공식 사이트 열기: https://www.microarch.org/micro59/",
      })
      .first(),
  ).toBeVisible()
  await page.getByRole("button", { name: "MICRO 2026 상세 보기" }).click()
  await expect(page.getByRole("heading", { name: "주요 일정" })).toBeVisible()
  await expect(page.getByText("논문 제출").first()).toBeVisible()
  await expect(page.getByText("학회 개최").first()).toBeVisible()
  await expect(page.getByRole("heading", { name: "근거 보기" })).toBeVisible()
  await expect(page.getByRole("link", { name: "MICRO 2026 공식 일정", exact: true })).toBeVisible()
  await expect(page.getByText("시간대 검수 필요").first()).toBeVisible()
  if (testInfo.project.name !== "desktop-1280") {
    await expect(page.getByLabel("선택한 학회의 근거와 변경 이력")).toHaveCSS(
      "transform",
      "matrix(1, 0, 0, 1, 0, 0)",
    )
  }

  await page.screenshot({
    fullPage: testInfo.project.name === "desktop-1280",
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
  const emptyResult = page.getByText("검색 결과가 없습니다")
  await expect(emptyResult).toBeVisible()
  await page.getByRole("tab", { name: "목록" }).focus()
  await emptyResult.scrollIntoViewIfNeeded()
  await page.screenshot({
    fullPage: false,
    path: `../../.omo/evidence/browser/${testInfo.project.name}-empty.png`,
  })

  await page.emulateMedia({ reducedMotion: "reduce" })
  expect(
    await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches),
  ).toBe(true)
})
