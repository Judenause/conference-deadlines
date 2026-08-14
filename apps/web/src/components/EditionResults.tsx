import type { Edition } from "@conf/contracts"
import { Icon } from "./Icons"
import { StatusBadge } from "./Primitives"

interface ResultsProps {
  readonly editions: readonly Edition[]
  readonly selectedId: string | undefined
  readonly view: "list" | "calendar"
  readonly onSelect: (editionId: string) => void
}

const MARCH_2026_WEEKS = [
  [1, 2, 3, 4, 5, 6, 7],
  [8, 9, 10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19, 20, 21],
  [22, 23, 24, 25, 26, 27, 28],
  [29, 30, 31, 32, 33, 34, 35],
] as const

function EditionCard({
  edition,
  selected,
  onSelect,
}: {
  readonly edition: Edition
  readonly selected: boolean
  readonly onSelect: () => void
}) {
  const deadline = edition.deadlines[0]
  return (
    <button
      aria-pressed={selected}
      aria-label={`${edition.acronym} 상세 보기`}
      className="edition-row"
      data-selected={selected}
      onClick={onSelect}
      type="button"
    >
      <span className="edition-mark">{edition.acronym.split(" ")[0]}</span>
      <span className="edition-copy">
        <strong>{edition.acronym}</strong>
        <span>{edition.name}</span>
        <small>
          {edition.categories.join(" · ")} · {edition.location}
        </small>
      </span>
      <span className="edition-date">
        <StatusBadge status={edition.status} />
        <strong>{deadline?.displayDate ?? "일정 미공개"}</strong>
        <small>{deadline?.timezone ?? "공식 발표 대기"}</small>
      </span>
      <Icon name="arrow" />
    </button>
  )
}

export function EditionResults({ editions, selectedId, view, onSelect }: ResultsProps) {
  if (editions.length === 0)
    return (
      <div className="empty-state">
        <span className="empty-state__icon">
          <Icon name="search" />
        </span>
        <h2>검색 결과가 없습니다</h2>
        <p>약어 또는 학회 이름을 바꿔 검색해 보세요.</p>
      </div>
    )
  if (view === "calendar")
    return (
      <div className="calendar-view">
        <div className="agenda mobile-agenda">
          <div className="agenda-month">
            <span>MAR</span>
            <strong>2026년 3월</strong>
          </div>
          {editions.map((edition) => (
            <EditionCard
              edition={edition}
              key={edition.id}
              onSelect={() => onSelect(edition.id)}
              selected={selectedId === edition.id}
            />
          ))}
        </div>
        <div className="month-grid-wrap">
          <div className="month-grid-head">
            <p className="eyebrow">MARCH 2026</p>
            <h2>2026년 3월</h2>
          </div>
          <table className="month-grid">
            <caption className="sr-only">2026년 3월 학회 마감 일정</caption>
            <thead>
              <tr>
                {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                  <th key={day} scope="col">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MARCH_2026_WEEKS.map((week) => (
                <tr key={`week-${week[0]}`}>
                  {week.map((day) => {
                    const due =
                      day === 16 ? editions.find((edition) => edition.id === "cui-2026") : undefined
                    return (
                      <td data-empty={day > 31} key={`day-${day}`}>
                        {day <= 31 ? (
                          <>
                            <span>{day}</span>
                            {due ? (
                              <button
                                aria-pressed={selectedId === due.id}
                                onClick={() => onSelect(due.id)}
                                type="button"
                              >
                                <strong>{due.acronym}</strong>
                                <small>23:59 AoE</small>
                              </button>
                            ) : null}
                          </>
                        ) : null}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  return (
    <div className="edition-list deadline-timeline">
      <div className="timeline-month">
        <span>MAR</span>
        <strong>2026년 3월</strong>
      </div>
      {editions.map((edition) => (
        <EditionCard
          edition={edition}
          key={edition.id}
          onSelect={() => onSelect(edition.id)}
          selected={selectedId === edition.id}
        />
      ))}
    </div>
  )
}
