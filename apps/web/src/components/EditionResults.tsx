import type { Edition } from "@conf/contracts"
import { CalendarView } from "./CalendarView"
import { EditionCard } from "./EditionCard"
import { groupEditions } from "./edition-dates"
import { Icon } from "./Icons"

interface ResultsProps {
  readonly editions: readonly Edition[]
  readonly selectedId: string | undefined
  readonly view: "list" | "calendar"
  readonly onSelect: (editionId: string) => void
}

export function EditionResults({ editions, selectedId, view, onSelect }: ResultsProps) {
  if (editions.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state__icon">
          <Icon name="search" />
        </span>
        <h2>검색 결과가 없습니다</h2>
        <p>현재 이후 일정만 표시합니다. 검색어나 분야 필터를 바꿔 보세요.</p>
      </div>
    )
  }
  if (view === "calendar") {
    return <CalendarView editions={editions} onSelect={onSelect} selectedId={selectedId} />
  }
  return (
    <div className="edition-list deadline-timeline">
      {groupEditions(editions).map((group) => (
        <section aria-labelledby={`group-${group.key}`} className="timeline-group" key={group.key}>
          <div className="timeline-month">
            <span>{group.marker}</span>
            <strong id={`group-${group.key}`}>{group.label}</strong>
          </div>
          {group.editions.map((edition) => (
            <EditionCard
              edition={edition}
              key={edition.id}
              onSelect={() => onSelect(edition.id)}
              selected={selectedId === edition.id}
            />
          ))}
        </section>
      ))}
    </div>
  )
}
