import type { Edition } from "@conf/contracts"
import { editionCategoryTone } from "./category-tone"
import { deadlineDateIso, localDateIso, nextUpcomingDeadline } from "./edition-dates"
import { Icon } from "./Icons"

interface TimelineViewProps {
  readonly editions: readonly Edition[]
  readonly selectedId: string | undefined
  readonly onSelect: (editionId: string) => void
}

interface TimelineWindow {
  readonly start: number
  readonly end: number
  readonly months: readonly { readonly key: string; readonly label: string }[]
}

const DAY_MS = 86_400_000
const MIN_MONTHS = 6

function dateValue(date: string): number {
  const [year, month, day] = date.split("-").map(Number)
  return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1)
}

function monthKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`
}

function timelineWindow(editions: readonly Edition[], now: Date): TimelineWindow {
  const start = Date.UTC(now.getFullYear(), now.getMonth(), 1)
  const minimumEnd = Date.UTC(now.getFullYear(), now.getMonth() + MIN_MONTHS, 1)
  const visibleDates = editions.flatMap((edition) => [
    ...edition.deadlines.map(deadlineDateIso),
    edition.conferenceEnd,
    edition.conferenceStart,
  ])
  const furthest = visibleDates.reduce(
    (latest, date) => (date ? Math.max(latest, dateValue(date)) : latest),
    minimumEnd,
  )
  const furthestDate = new Date(furthest)
  const end = Date.UTC(furthestDate.getUTCFullYear(), furthestDate.getUTCMonth() + 1, 1)
  const months: { key: string; label: string }[] = []
  const cursor = new Date(start)
  while (cursor.getTime() < end) {
    const year = cursor.getUTCFullYear()
    const month = cursor.getUTCMonth()
    months.push({
      key: monthKey(year, month),
      label: month === 0 || months.length === 0 ? `${year}년 ${month + 1}월` : `${month + 1}월`,
    })
    cursor.setUTCMonth(month + 1)
  }
  return { start, end, months }
}

function percentAt(date: string, window: TimelineWindow): number {
  const value = Math.min(window.end, Math.max(window.start, dateValue(date)))
  return ((value - window.start) / (window.end - window.start)) * 100
}

function timelineAnchor(edition: Edition, now: Date): string | undefined {
  const deadline = nextUpcomingDeadline(edition, now)
  return (deadline ? deadlineDateIso(deadline) : undefined) ?? edition.conferenceStart ?? undefined
}

export function TimelineView({ editions, selectedId, onSelect }: TimelineViewProps) {
  const now = new Date()
  const today = localDateIso(now)
  const window = timelineWindow(editions, now)
  const orderedEditions = [...editions].sort((left, right) => {
    const leftDate = timelineAnchor(left, now)
    const rightDate = timelineAnchor(right, now)
    if (leftDate && rightDate) return leftDate.localeCompare(rightDate)
    if (leftDate) return -1
    if (rightDate) return 1
    return left.year - right.year || left.acronym.localeCompare(right.acronym)
  })

  return (
    <section aria-label="월별 학회 타임라인" className="timeline-board">
      <div className="timeline-board__intro">
        <div>
          <p className="eyebrow">AT A GLANCE</p>
          <h2>제출일 · 학회 기간 타임라인</h2>
          <p>제출 마감과 학회 개최 기간을 하나의 시간축에서 비교합니다.</p>
        </div>
        <fieldset className="timeline-legend">
          <legend className="sr-only">타임라인 범례</legend>
          <span>
            <i data-kind="deadline" />
            제출
          </span>
          <span>
            <i data-kind="conference" />
            학회
          </span>
          <span>
            <b aria-hidden="true" className="timeline-legend__palette">
              <i data-category-tone="circuit" />
              <i data-category-tone="ai" />
              <i data-category-tone="system" />
              <i data-category-tone="archi" />
              <i data-category-tone="cv" />
            </b>
            분야
          </span>
        </fieldset>
      </div>
      <p className="timeline-board__hint">표 안을 가로로 이동해 월별 일정을 확인하세요.</p>
      <div className="timeline-board__viewport">
        <div className="timeline-board__canvas">
          <div className="timeline-board__axis">
            <div className="timeline-board__corner">학회 / 공식 사이트</div>
            <div
              className="timeline-board__months"
              style={{
                gridTemplateColumns: `repeat(${window.months.length}, var(--timeline-month-width))`,
              }}
            >
              {window.months.map((month) => (
                <span key={month.key}>{month.label}</span>
              ))}
            </div>
          </div>
          <div className="timeline-board__rows">
            {orderedEditions.map((edition) => {
              const deadline = nextUpcomingDeadline(edition, now)
              const deadlineDate = deadline ? deadlineDateIso(deadline) : undefined
              const conferenceStart = edition.conferenceStart
                ? edition.conferenceStart < today
                  ? today
                  : edition.conferenceStart
                : undefined
              const conferenceEnd = edition.conferenceEnd ?? edition.conferenceStart
              const conferenceLeft = conferenceStart
                ? percentAt(conferenceStart, window)
                : undefined
              const conferenceRight = conferenceEnd
                ? percentAt(conferenceEnd, window)
                : conferenceLeft
              const conferenceWidth =
                conferenceLeft !== undefined && conferenceRight !== undefined
                  ? Math.max(
                      0.8,
                      conferenceRight -
                        conferenceLeft +
                        (DAY_MS / (window.end - window.start)) * 100,
                    )
                  : undefined
              const editionTitle = edition.acronym.includes(String(edition.year))
                ? edition.acronym
                : `${edition.acronym} ${edition.year}`
              const timelineSummary = [
                editionTitle,
                deadline ? `${deadline.label} ${deadline.displayDate}` : undefined,
                conferenceStart ? `학회 기간 ${edition.dateRange}` : undefined,
              ]
                .filter((value): value is string => value !== undefined)
                .join(" · ")
              return (
                <article
                  aria-label={timelineSummary}
                  className="timeline-board__row"
                  data-category-tone={editionCategoryTone(edition.categories)}
                  data-selected={selectedId === edition.id}
                  key={edition.id}
                >
                  <div className="timeline-board__identity">
                    <button
                      aria-label={`${edition.acronym} ${edition.year} 상세 보기`}
                      onClick={() => onSelect(edition.id)}
                      type="button"
                    >
                      <strong>{editionTitle}</strong>
                      <span>{edition.location}</span>
                    </button>
                    <a
                      aria-label={`${edition.acronym} ${edition.year} 공식 사이트 열기`}
                      href={edition.officialUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Icon name="source" />
                      <span>{edition.officialUrl}</span>
                    </a>
                  </div>
                  <div className="timeline-board__track">
                    <div
                      className="timeline-board__grid"
                      style={{
                        gridTemplateColumns: `repeat(${window.months.length}, var(--timeline-month-width))`,
                      }}
                    >
                      {window.months.map((month) => (
                        <span key={month.key} />
                      ))}
                    </div>
                    <span
                      className="timeline-board__today"
                      style={{ left: `${percentAt(today, window)}%` }}
                    >
                      <b>TODAY</b>
                    </span>
                    {deadlineDate && deadline ? (
                      <button
                        aria-label={`${editionTitle} ${deadline.label} ${deadline.displayDate} 상세 보기`}
                        className="timeline-board__deadline"
                        onClick={() => onSelect(edition.id)}
                        style={{ left: `${percentAt(deadlineDate, window)}%` }}
                        title={`${deadline.label} · ${deadline.displayDate}`}
                        type="button"
                      >
                        제출
                      </button>
                    ) : null}
                    {conferenceLeft !== undefined && conferenceWidth !== undefined ? (
                      <button
                        aria-label={`${editionTitle} 학회 기간 ${edition.dateRange} 상세 보기`}
                        className="timeline-board__conference"
                        onClick={() => onSelect(edition.id)}
                        style={{ left: `${conferenceLeft}%`, width: `${conferenceWidth}%` }}
                        title={`학회 기간 · ${edition.dateRange}`}
                        type="button"
                      >
                        학회
                      </button>
                    ) : null}
                    {!deadlineDate && conferenceLeft === undefined ? (
                      <span className="timeline-board__pending">일정 미공개</span>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
