import type { Edition } from "@conf/contracts"
import { categoryTone, editionCategoryTone } from "./category-tone"
import {
  deadlineCountdown,
  isConferenceCurrentOrUpcoming,
  isConferenceInProgress,
  nextUpcomingDeadline,
} from "./edition-dates"
import { Icon } from "./Icons"
import { StatusBadge } from "./Primitives"

interface EditionCardProps {
  readonly edition: Edition
  readonly selected: boolean
  readonly onSelect: () => void
}

function officialHostname(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "")
}

export function EditionCard({ edition, selected, onSelect }: EditionCardProps) {
  const now = new Date()
  const nextDeadline = nextUpcomingDeadline(edition, now)
  const countdown = nextDeadline
    ? deadlineCountdown(nextDeadline, now)
    : { label: "TBD", urgency: "closed" as const }
  const showConference = isConferenceCurrentOrUpcoming(edition, now)
  const conferenceInProgress = isConferenceInProgress(edition, now)
  const primaryCategoryTone = editionCategoryTone(edition.categories)
  return (
    <article
      className="edition-entry conference-card"
      data-category-tone={primaryCategoryTone}
      data-selected={selected}
    >
      <button
        aria-pressed={selected}
        aria-label={`${edition.acronym} 상세 보기`}
        className="edition-row"
        onClick={onSelect}
        type="button"
      >
        <span className="conference-card__heading">
          <span>
            <strong>{edition.acronym}</strong>
            <small>{edition.name}</small>
          </span>
          <span className="deadline-badge" data-urgency={countdown.urgency}>
            {countdown.label}
          </span>
        </span>
        <span className="conference-card__schedule">
          {nextDeadline ? (
            <span>
              <small>{nextDeadline.label}</small>
              <strong>{nextDeadline.displayDate}</strong>
            </span>
          ) : (
            <span>
              <small>Paper deadline</small>
              <strong>공식 발표 대기</strong>
            </span>
          )}
          {showConference ? (
            <span>
              <small>{conferenceInProgress ? "학회 진행 중" : "학회 개최"}</small>
              <strong>{conferenceInProgress ? "오늘 진행 중" : edition.dateRange}</strong>
            </span>
          ) : null}
        </span>
        <span className="edition-taxonomy">
          <span className="category-labels">
            {edition.categories.map((category) => (
              <span
                className="category-label"
                data-category-tone={categoryTone(category)}
                key={category}
              >
                {category}
              </span>
            ))}
          </span>
          {edition.tier ? <span className="tier-badge">{edition.tier}</span> : null}
          <span>{edition.location}</span>
        </span>
      </button>
      <div className="conference-card__footer">
        <StatusBadge status={edition.status} />
        <a
          aria-label={`${edition.acronym} 공식 사이트 열기: ${edition.officialUrl}`}
          className="edition-official-link"
          href={edition.officialUrl}
          rel="noreferrer"
          target="_blank"
        >
          <span>Official source · {officialHostname(edition.officialUrl)}</span>
          <Icon name="source" />
        </a>
      </div>
    </article>
  )
}
