import type { Edition, Evidence, History } from "@conf/contracts"
import { Icon } from "./Icons"
import { StatusBadge } from "./Primitives"

interface EvidencePanelProps {
  readonly compact: boolean
  readonly edition: Edition | undefined
  readonly evidence: readonly Evidence[]
  readonly history: readonly History[]
  readonly loading: boolean
  readonly onClose: () => void
}

export function EvidencePanel({
  compact,
  edition,
  evidence,
  history,
  loading,
  onClose,
}: EvidencePanelProps) {
  return (
    <div
      aria-label="선택한 학회의 근거와 변경 이력"
      aria-hidden={compact && !edition}
      aria-modal={compact && Boolean(edition)}
      className="evidence-panel"
      data-open={Boolean(edition)}
      inert={compact && !edition ? true : undefined}
      role="dialog"
    >
      <div className="panel-head">
        <div>
          <p className="eyebrow">EVIDENCE RAIL</p>
          <h2>{edition?.acronym ?? "일정을 선택하세요"}</h2>
        </div>
        <button
          aria-label="상세 닫기"
          className="icon-button panel-close"
          onClick={onClose}
          type="button"
        >
          <Icon name="close" />
        </button>
      </div>
      {loading ? (
        <output className="panel-loading">근거를 연결하는 중...</output>
      ) : edition ? (
        <>
          <p className="panel-description">{edition.description}</p>
          <dl className="edition-meta">
            <div>
              <dt>개최</dt>
              <dd>{edition.dateRange}</dd>
            </div>
            <div>
              <dt>장소</dt>
              <dd>{edition.location}</dd>
            </div>
            {edition.tier ? (
              <div>
                <dt>연구실 분류</dt>
                <dd>
                  {edition.categories.join(" · ")} · {edition.tier}
                </dd>
              </div>
            ) : null}
          </dl>
          {edition.officialUrl ? (
            <a
              className="official-source-link"
              href={edition.officialUrl}
              rel="noreferrer"
              target="_blank"
            >
              <Icon name="source" />
              <span>{edition.acronym} 공식 일정</span>
            </a>
          ) : null}
          <section className="panel-section">
            <div className="section-title">
              <h3>주요 마감</h3>
              <span>{edition.deadlines.length}</span>
            </div>
            {edition.deadlines.length > 0 ? (
              <ol className="deadline-stack">
                {edition.deadlines.map((deadline) => (
                  <li key={deadline.id}>
                    <div className="deadline-line">
                      <span
                        className="deadline-check"
                        data-review={
                          deadline.status === "review-needed" ||
                          deadline.status === "timezone-review-needed"
                        }
                      >
                        <Icon
                          name={
                            deadline.status === "review-needed" ||
                            deadline.status === "timezone-review-needed"
                              ? "clock"
                              : "check"
                          }
                        />
                      </span>
                      <div>
                        <strong>{deadline.label}</strong>
                        <span>{deadline.track}</span>
                      </div>
                      <StatusBadge status={deadline.status} />
                    </div>
                    <time dateTime={deadline.dueAtUtc}>{deadline.displayDate}</time>
                    <small>
                      {deadline.timezone} · UTC {deadline.dueAtUtc.slice(0, 16).replace("T", " ")}
                    </small>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="quiet-state">공식 일정이 아직 공개되지 않았습니다.</p>
            )}
          </section>
          <section className="panel-section">
            <div className="section-title">
              <h3>근거 보기</h3>
              <span>{evidence.length}</span>
            </div>
            {evidence.length > 0 ? (
              <div className="source-list">
                {evidence.map((item) => (
                  <a href={item.sourceUrl} key={item.id} rel="noreferrer" target="_blank">
                    <span className="source-icon">
                      <Icon name="source" />
                    </span>
                    <span>
                      <strong>{item.sourceTitle}</strong>
                      <small>{item.rawValue}</small>
                      <small>
                        신뢰도 {Math.round(item.confidence * 100)}% · {item.locator}
                      </small>
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="quiet-state">공개된 근거가 없습니다.</p>
            )}
          </section>
          <section className="panel-section">
            <div className="section-title">
              <h3>변경 이력</h3>
              <span>{history.length}</span>
            </div>
            {history.length > 0 ? (
              <ol className="history-list">
                {history.map((item) => (
                  <li key={item.id}>
                    <span className="history-node" />
                    <div>
                      <strong>{item.summary}</strong>
                      <time dateTime={item.changedAt}>{item.changedAt.slice(0, 10)}</time>
                      <p>
                        <del>{item.before}</del>
                        <span>{item.after}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="quiet-state">기록된 변경이 없습니다.</p>
            )}
          </section>
        </>
      ) : (
        <div className="panel-intro">
          <span>
            <Icon name="source" />
          </span>
          <h3>날짜의 근거까지 확인하세요</h3>
          <p>
            목록에서 학회를 선택하면 공식 원문, 시간대 해석, 변경 이력을 한 흐름에서 볼 수 있습니다.
          </p>
        </div>
      )}
    </div>
  )
}
