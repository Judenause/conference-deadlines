import type { Edition } from "@conf/contracts"
import {
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

export function EditionCard({ edition, selected, onSelect }: EditionCardProps) {
  const now = new Date()
  const nextDeadline = nextUpcomingDeadline(edition, now)
  const showConference = isConferenceCurrentOrUpcoming(edition, now)
  const conferenceInProgress = isConferenceInProgress(edition, now)
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
          <span className="milestone-stack">
            {nextDeadline ? (
              <span>
                <small>{nextDeadline.label}</small>
                <strong>{nextDeadline.displayDate}</strong>
              </span>
            ) : null}
            {showConference ? (
              <span>
                <small>{conferenceInProgress ? "학회 진행 중" : "학회 개최"}</small>
                <strong>{conferenceInProgress ? "오늘 진행 중" : edition.dateRange}</strong>
              </span>
            ) : null}
          </span>
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
