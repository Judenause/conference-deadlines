export type CategoryTone = "circuit" | "ai" | "system" | "archi" | "cv" | "neutral"

export const FIELD_CATEGORY_ORDER = ["Circuit", "AI", "System", "Archi", "CV"] as const

export function categoryTone(category: string): CategoryTone {
  switch (category) {
    case "Circuit":
      return "circuit"
    case "AI":
      return "ai"
    case "System":
      return "system"
    case "Archi":
      return "archi"
    case "CV":
      return "cv"
    default:
      return "neutral"
  }
}

export function editionCategoryTone(categories: readonly string[]): CategoryTone {
  for (const category of categories) {
    const tone = categoryTone(category)
    if (tone !== "neutral") return tone
  }
  return "neutral"
}
