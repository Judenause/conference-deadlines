import { type KeyboardEvent, type ReactNode, useState } from "react"
import { Icon } from "./Icons"

export type CatalogView = "list" | "timeline" | "calendar"

export function Button({
  children,
  onClick,
}: {
  readonly children: ReactNode
  readonly onClick?: () => void
}) {
  return (
    <button className="button" onClick={onClick} type="button">
      {children}
    </button>
  )
}

export function StatusBadge({
  status,
}: {
  readonly status:
    | "confirmed"
    | "extended"
    | "review-needed"
    | "timezone-review-needed"
    | "dates-pending"
}) {
  const labels = {
    confirmed: "확인됨",
    extended: "연장됨",
    "review-needed": "검수 대기",
    "timezone-review-needed": "시간대 검수 필요",
    "dates-pending": "발표 대기",
  }
  return (
    <span className={`status status--${status}`}>
      <span aria-hidden="true" className="status__dot" />
      {labels[status]}
    </span>
  )
}

export function ViewTabs({
  value,
  onChange,
  listPanelId,
  timelinePanelId,
  calendarPanelId,
}: {
  readonly value: CatalogView
  readonly onChange: (value: CatalogView) => void
  readonly listPanelId: string
  readonly timelinePanelId: string
  readonly calendarPanelId: string
}) {
  function move(event: KeyboardEvent<HTMLButtonElement>, current: CatalogView) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
    event.preventDefault()
    const views: readonly CatalogView[] = ["timeline", "list", "calendar"]
    const currentIndex = views.indexOf(current)
    const offset = event.key === "ArrowLeft" ? views.length - 1 : 1
    const next = views[(currentIndex + offset) % views.length]
    if (!next) return
    onChange(next)
    const sibling = event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(
      `[data-view="${next}"]`,
    )
    sibling?.focus()
  }
  return (
    <div aria-label="보기 방식" className="view-tabs" role="tablist">
      <button
        aria-controls={timelinePanelId}
        aria-selected={value === "timeline"}
        data-view="timeline"
        id={`${timelinePanelId}-tab`}
        onKeyDown={(event) => move(event, "timeline")}
        onClick={() => onChange("timeline")}
        role="tab"
        tabIndex={value === "timeline" ? 0 : -1}
        type="button"
      >
        타임라인
      </button>
      <button
        aria-controls={listPanelId}
        aria-selected={value === "list"}
        data-view="list"
        id={`${listPanelId}-tab`}
        onKeyDown={(event) => move(event, "list")}
        onClick={() => onChange("list")}
        role="tab"
        tabIndex={value === "list" ? 0 : -1}
        type="button"
      >
        목록
      </button>
      <button
        aria-controls={calendarPanelId}
        aria-selected={value === "calendar"}
        data-view="calendar"
        id={`${calendarPanelId}-tab`}
        onKeyDown={(event) => move(event, "calendar")}
        onClick={() => onChange("calendar")}
        role="tab"
        tabIndex={value === "calendar" ? 0 : -1}
        type="button"
      >
        캘린더
      </button>
    </div>
  )
}

export function PrimitiveShowcase() {
  const [view, setView] = useState<CatalogView>("timeline")
  return (
    <main className="showcase">
      <p className="eyebrow">DEVELOPMENT ONLY</p>
      <h1>Primitive showcase</h1>
      <section>
        <h2>Buttons</h2>
        <Button>
          <Icon name="source" /> 근거 보기
        </Button>
      </section>
      <section>
        <h2>Status</h2>
        <div className="showcase-row">
          <StatusBadge status="confirmed" />
          <StatusBadge status="extended" />
          <StatusBadge status="review-needed" />
          <StatusBadge status="timezone-review-needed" />
        </div>
      </section>
      <section>
        <h2>View tabs</h2>
        <ViewTabs
          calendarPanelId="showcase-calendar"
          listPanelId="showcase-list"
          timelinePanelId="showcase-timeline"
          value={view}
          onChange={setView}
        />
      </section>
    </main>
  )
}
