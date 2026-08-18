import type { Edition } from "@conf/contracts"
import { Icon } from "./Icons"
import { StatusBadge } from "./Primitives"

interface ResultsProps {
  readonly editions: readonly Edition[]
  readonly selectedId: string | undefined
  readonly view: "list" | "calendar"
  readonly onSelect: (editionId: string) => void
}

const MONTH_MARKERS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const

interface EditionGroup {
  readonly key: string
  readonly marker: string
  readonly label: string
  readonly editions: readonly Edition[]
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

function displayDay(edition: Edition): number | undefined {
  const day = Number(edition.deadlines[0]?.displayDate.split(".")[2]?.trim().split(" ")[0])
  return Number.isInteger(day) && day >= 1 && day <= 31 ? day : undefined
}

function groupEditions(editions: readonly Edition[]): readonly EditionGroup[] {
  const groups = new Map<string, { marker: string; label: string; editions: Edition[] }>()
  const ordered = [...editions].sort((left, right) => {
    const leftDate = left.deadlines[0]?.dueAtUtc
    const rightDate = right.deadlines[0]?.dueAtUtc
    if (leftDate && rightDate) return leftDate.localeCompare(rightDate)
    if (leftDate) return -1
    if (rightDate) return 1
    return left.year - right.year || left.acronym.localeCompare(right.acronym)
  })

  for (const edition of ordered) {
    const deadline = edition.deadlines[0]
    const dateParts = deadline?.displayDate.split(".")
    const year = dateParts?.[0]?.trim()
    const monthNumber = Number(dateParts?.[1]?.trim())
    const hasMonth =
      Boolean(year) && Number.isInteger(monthNumber) && monthNumber >= 1 && monthNumber <= 12
    const key = hasMonth ? `${year}-${monthNumber}` : `${edition.year}-pending`
    const marker = hasMonth ? (MONTH_MARKERS[monthNumber - 1] ?? "DATE") : String(edition.year)
    const label = hasMonth ? `${year}년 ${monthNumber}월` : `${edition.year}년 · 마감 미공개`
    const existing = groups.get(key)
    if (existing) existing.editions.push(edition)
    else groups.set(key, { marker, label, editions: [edition] })
  }

  return [...groups].map(([key, group]) => ({ key, ...group }))
}

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
    <div className="edition-entry" data-selected={selected}>
      <button
        aria-pressed={selected}
        aria-label={`${edition.acronym} 상세 보기`}
        className="edition-row"
        onClick={onSelect}
        type="button"
      >
        <span className="edition-mark">{edition.acronym.split(" ")[0]?.slice(0, 5)}</span>
        <span className="edition-copy">
          <strong>{edition.acronym}</strong>
          <span>{edition.name}</span>
          <small className="edition-taxonomy">
            <span>
              {edition.categories.join(" · ")} · {edition.location}
            </span>
            {edition.tier ? <span className="tier-badge">{edition.tier}</span> : null}
          </small>
        </span>
        <span className="edition-date">
          <StatusBadge status={edition.status} />
          <strong>{deadline?.displayDate ?? "일정 미공개"}</strong>
          <small>{deadline?.timezone ?? "공식 발표 대기"}</small>
        </span>
        <Icon name="arrow" />
      </button>
      <a
        aria-label={`${edition.acronym} 공식 사이트 열기: ${edition.officialUrl}`}
        className="edition-official-link"
        href={edition.officialUrl}
        rel="noreferrer"
        target="_blank"
      >
        <Icon name="source" />
        <span>{edition.officialUrl}</span>
      </a>
    </div>
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
  if (view === "calendar") {
    const groups = groupEditions(editions)
    const datedGroups = groups.filter((group) => !group.key.endsWith("-pending"))
    const pendingGroups = groups.filter((group) => group.key.endsWith("-pending"))
    return (
      <div className="calendar-view">
        <div className="mobile-calendar-agenda">
          {groups.map((group) => (
            <section aria-labelledby={`agenda-${group.key}`} className="agenda" key={group.key}>
              <div className="agenda-month">
                <span>{group.marker}</span>
                <strong id={`agenda-${group.key}`}>{group.label}</strong>
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
        <div className="desktop-calendar-grid">
          {datedGroups.map((group) => {
            const [yearValue, monthValue] = group.key.split("-")
            const year = Number(yearValue)
            const month = Number(monthValue)
            return (
              <section className="month-grid-wrap" key={group.key}>
                <div className="month-grid-head">
                  <p className="eyebrow">{group.marker} DEADLINES</p>
                  <h2>{group.label}</h2>
                </div>
                <table className="month-grid">
                  <caption className="sr-only">{group.label} 학회 마감 일정</caption>
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
                        {week.map((day, dayIndex) => {
                          const dueEditions = day
                            ? group.editions.filter((edition) => displayDay(edition) === day)
                            : []
                          return (
                            <td
                              data-empty={day === null}
                              key={`${group.key}-day-${weekIndex * 7 + dayIndex + 1}`}
                            >
                              {day ? <span>{day}</span> : null}
                              {dueEditions.map((edition) => (
                                <button
                                  aria-label={`${edition.acronym} 상세 보기`}
                                  aria-pressed={selectedId === edition.id}
                                  key={edition.id}
                                  onClick={() => onSelect(edition.id)}
                                  type="button"
                                >
                                  <strong>{edition.acronym}</strong>
                                  <small>
                                    {edition.deadlines[0]?.displayDate.split(" ").at(-1)}
                                  </small>
                                </button>
                              ))}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ul aria-label={`${group.label} 공식 사이트`} className="month-source-list">
                  {group.editions.map((edition) => (
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
          {pendingGroups.map((group) => (
            <section aria-labelledby={`pending-${group.key}`} className="agenda" key={group.key}>
              <div className="agenda-month">
                <span>{group.marker}</span>
                <strong id={`pending-${group.key}`}>{group.label}</strong>
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
      </div>
    )
  }
  const groups = groupEditions(editions)
  return (
    <div className="edition-list deadline-timeline">
      {groups.map((group) => (
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
