import type { RefObject } from "react"
import { categoryTone } from "./category-tone"
import { Icon } from "./Icons"
import { type CatalogView, ViewTabs } from "./Primitives"

interface CatalogControlsProps {
  readonly query: string
  readonly searchRef: RefObject<HTMLInputElement | null>
  readonly onQueryChange: (query: string) => void
}

interface ProductHeaderProps {
  readonly categories: readonly string[]
  readonly category: string
  readonly count: number
  readonly headingId: string
  readonly view: CatalogView
  readonly listPanelId: string
  readonly timelinePanelId: string
  readonly calendarPanelId: string
  readonly onCategoryChange: (category: string) => void
  readonly onViewChange: (view: CatalogView) => void
}

export function CatalogControls({ query, searchRef, onQueryChange }: CatalogControlsProps) {
  return (
    <section aria-label="학회 검색" className="catalog-toolbar">
      <label className="search-field">
        <span className="sr-only">학회 검색</span>
        <Icon name="search" />
        <input
          aria-label="학회 검색"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search CVPR, DAC, ISCA, NeurIPS..."
          ref={searchRef}
          type="search"
          value={query}
        />
        <kbd>⌘ K</kbd>
      </label>
    </section>
  )
}

export function ProductHeader({
  categories,
  category,
  count,
  headingId,
  view,
  listPanelId,
  timelinePanelId,
  calendarPanelId,
  onCategoryChange,
  onViewChange,
}: ProductHeaderProps) {
  return (
    <div className="product-header">
      <div>
        <p className="product-kicker">DISCOVER</p>
        <h2 id={headingId}>Upcoming deadlines</h2>
        <span className="results-count" aria-live="polite">
          {count}개 일정
        </span>
      </div>
      <div className="product-header__actions">
        <ViewTabs
          calendarPanelId={calendarPanelId}
          listPanelId={listPanelId}
          timelinePanelId={timelinePanelId}
          onChange={onViewChange}
          value={view}
        />
        <fieldset className="filter-scroll">
          <legend className="sr-only">분야 필터</legend>
          {categories.map((item) => (
            <button
              aria-label={item}
              aria-pressed={category === item}
              data-category-tone={categoryTone(item)}
              key={item}
              onClick={() => onCategoryChange(item)}
              type="button"
            >
              {item === "전체" ? "All" : item}
            </button>
          ))}
        </fieldset>
      </div>
    </div>
  )
}
