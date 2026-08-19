import type { RefObject } from "react"
import { Icon } from "./Icons"
import { type CatalogView, ViewTabs } from "./Primitives"

interface CatalogControlsProps {
  readonly categories: readonly string[]
  readonly category: string
  readonly query: string
  readonly searchRef: RefObject<HTMLInputElement | null>
  readonly onCategoryChange: (category: string) => void
  readonly onQueryChange: (query: string) => void
}

interface ProductHeaderProps {
  readonly count: number
  readonly headingId: string
  readonly view: CatalogView
  readonly listPanelId: string
  readonly timelinePanelId: string
  readonly calendarPanelId: string
  readonly onViewChange: (view: CatalogView) => void
}

export function CatalogControls({
  categories,
  category,
  query,
  searchRef,
  onCategoryChange,
  onQueryChange,
}: CatalogControlsProps) {
  return (
    <section aria-label="학회 검색과 필터" className="catalog-toolbar">
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
      <fieldset className="filter-scroll">
        <legend className="sr-only">분야 필터</legend>
        {categories.map((item) => (
          <button
            aria-label={item}
            aria-pressed={category === item}
            key={item}
            onClick={() => onCategoryChange(item)}
            type="button"
          >
            {item === "전체" ? "All" : item}
          </button>
        ))}
      </fieldset>
    </section>
  )
}

export function ProductHeader({
  count,
  headingId,
  view,
  listPanelId,
  timelinePanelId,
  calendarPanelId,
  onViewChange,
}: ProductHeaderProps) {
  return (
    <div className="product-header">
      <div>
        <p className="product-kicker">DISCOVER</p>
        <h2 id={headingId}>Upcoming deadlines</h2>
        <p>관심 분야의 제출 일정과 공식 근거를 빠르게 비교하세요.</p>
        <span className="results-count" aria-live="polite">
          {count}개 일정
        </span>
      </div>
      <ViewTabs
        calendarPanelId={calendarPanelId}
        listPanelId={listPanelId}
        timelinePanelId={timelinePanelId}
        onChange={onViewChange}
        value={view}
      />
    </div>
  )
}
