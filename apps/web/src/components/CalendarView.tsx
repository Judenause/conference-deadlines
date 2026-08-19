import type { Edition } from "@conf/contracts"
import { useId } from "react"
import { editionCategoryTone } from "./category-tone"
import { EditionCard } from "./EditionCard"
import { calendarEventGroups, eventDay, localDateIso } from "./edition-dates"
import { Icon } from "./Icons"

interface CalendarViewProps {
  readonly editions: readonly Edition[]
  readonly selectedId: string | undefined
  readonly onSelect: (editionId: string) => void
}

function calendarWeeks(year: number, month: number): readonly (readonly (number | null)[])[] {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const dayCount = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: dayCount }, (_, index) => index + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (number | null)[][] = []
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7))
  return weeks
}

export function CalendarView({ editions, selectedId, onSelect }: CalendarViewProps) {
  const mobilePendingId = useId()
  const desktopPendingId = useId()
  const groups = calendarEventGroups(editions)
  const today = localDateIso(new Date())
  const editionsWithEvents = new Set(
    groups.flatMap((group) => group.events.map((event) => event.edition.id)),
  )
  const pendingEditions = editions.filter((edition) => !editionsWithEvents.has(edition.id))
  return (
    <div className="calendar-view">
      <div className="mobile-calendar-agenda">
        {groups.map((group) => (
          <section aria-labelledby={`agenda-${group.key}`} className="agenda" key={group.key}>
            <div className="agenda-month">
              <span>{group.marker}</span>
              <h2 id={`agenda-${group.key}`}>{group.label}</h2>
            </div>
            <ol className="calendar-agenda-list">
              {group.events.map((event) => (
                <li
                  data-category-tone={editionCategoryTone(event.edition.categories)}
                  data-event-kind={event.type}
                  key={event.id}
                >
                  <time dateTime={event.date}>{event.date.slice(5).replace("-", ".")}</time>
                  <button
                    aria-label={`${event.edition.acronym} ${event.label} 상세 보기`}
                    aria-pressed={selectedId === event.edition.id}
                    onClick={() => onSelect(event.edition.id)}
                    type="button"
                  >
                    <strong>{event.edition.acronym}</strong>
                    <span>{event.label}</span>
                    <small>{event.timeLabel}</small>
                  </button>
                </li>
              ))}
            </ol>
            <ul aria-label={`${group.label} 공식 사이트`} className="month-source-list">
              {[
                ...new Map(group.events.map((event) => [event.edition.id, event.edition])).values(),
              ].map((edition) => (
                <li key={edition.id}>
                  <strong>{edition.acronym}</strong>
                  <a
                    aria-label={`${edition.acronym} 공식 사이트 열기: ${edition.officialUrl}`}
                    href={edition.officialUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Icon name="source" />
                    <span>{edition.officialUrl}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {pendingEditions.length > 0 ? (
          <section aria-labelledby={mobilePendingId} className="agenda">
            <div className="agenda-month">
              <span>WAIT</span>
              <h2 id={mobilePendingId}>다가오는 일정 미공개</h2>
            </div>
            {pendingEditions.map((edition) => (
              <EditionCard
                edition={edition}
                key={edition.id}
                onSelect={() => onSelect(edition.id)}
                selected={selectedId === edition.id}
              />
            ))}
          </section>
        ) : null}
      </div>
      <div className="desktop-calendar-grid">
        {groups.map((group) => {
          const [yearValue, monthValue] = group.key.split("-")
          const year = Number(yearValue)
          const month = Number(monthValue)
          const sourceEditions = [
            ...new Map(group.events.map((event) => [event.edition.id, event.edition])).values(),
          ]
          return (
            <section className="month-grid-wrap" key={group.key}>
              <div className="month-grid-head">
                <p className="eyebrow">{group.marker} TIMELINE</p>
                <h2>{group.label}</h2>
              </div>
              <table className="month-grid">
                <caption className="sr-only">{group.label} 제출 및 학회 개최 일정</caption>
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
                  {calendarWeeks(year, month).map((week, weekIndex) => (
                    <tr key={`${group.key}-week-${weekIndex + 1}`}>
                      {week.map((day, dayIndex) => (
                        <td
                          data-empty={day === null}
                          data-today={
                            group.key === today.slice(0, 7) && day === Number(today.slice(8, 10))
                          }
                          key={`${group.key}-day-${weekIndex * 7 + dayIndex + 1}`}
                        >
                          {day ? <span>{day}</span> : null}
                          {day
                            ? group.events
                                .filter((event) => eventDay(event) === day)
                                .map((event) => (
                                  <button
                                    aria-label={`${event.edition.acronym} ${event.label} 상세 보기`}
                                    aria-pressed={selectedId === event.edition.id}
                                    data-category-tone={editionCategoryTone(
                                      event.edition.categories,
                                    )}
                                    data-event-kind={event.type}
                                    key={event.id}
                                    onClick={() => onSelect(event.edition.id)}
                                    type="button"
                                  >
                                    <strong>
                                      {event.type === "conference" ? "개최" : "일정"} ·{" "}
                                      {event.edition.acronym}
                                    </strong>
                                    <small data-ongoing={event.label === "학회 진행 중"}>
                                      <span>{event.label}</span>
                                      {event.label === "학회 진행 중" ? (
                                        <span>{event.timeLabel}</span>
                                      ) : null}
                                    </small>
                                  </button>
                                ))
                            : null}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul aria-label={`${group.label} 공식 사이트`} className="month-source-list">
                {sourceEditions.map((edition) => (
                  <li key={edition.id}>
                    <strong>{edition.acronym}</strong>
                    <a
                      aria-label={`${edition.acronym} 공식 사이트 열기: ${edition.officialUrl}`}
                      href={edition.officialUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Icon name="source" />
                      <span>{edition.officialUrl}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
        {pendingEditions.length > 0 ? (
          <section aria-labelledby={desktopPendingId} className="agenda">
            <div className="agenda-month">
              <span>WAIT</span>
              <h2 id={desktopPendingId}>다가오는 일정 미공개</h2>
            </div>
            {pendingEditions.map((edition) => (
              <EditionCard
                edition={edition}
                key={edition.id}
                onSelect={() => onSelect(edition.id)}
                selected={selectedId === edition.id}
              />
            ))}
          </section>
        ) : null}
      </div>
    </div>
  )
}
