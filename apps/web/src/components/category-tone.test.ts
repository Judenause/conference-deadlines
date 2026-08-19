import { expect, test } from "vitest"
import { categoryTone, editionCategoryTone } from "./category-tone"

test.each([
  ["Circuit", "circuit"],
  ["AI", "ai"],
  ["System", "system"],
  ["Archi", "archi"],
  ["CV", "cv"],
  ["전체", "neutral"],
  ["Unknown", "neutral"],
] as const)("maps %s to the %s taxonomy tone", (category, tone) => {
  expect(categoryTone(category)).toBe(tone)
})

test("uses the first recognized category when an edition spans fields", () => {
  expect(editionCategoryTone(["Unknown", "CV", "AI"])).toBe("cv")
  expect(editionCategoryTone([])).toBe("neutral")
})
