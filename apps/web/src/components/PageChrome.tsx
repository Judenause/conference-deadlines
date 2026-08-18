import type { Edition } from "@conf/contracts"

interface NavigationProps {
  readonly methodId: string
}

export function Hero({ editions }: { readonly editions: readonly Edition[] }) {
  return (
    <section className="hero">
      <div>
        <p className="eyebrow">EVIDENCE-FIRST CONFERENCE CATALOG</p>
        <h1>학회 마감 일정</h1>
        <p className="hero-lead">
          연구실 관심 학회를 먼저 모으고, 바뀐 마감일과 공식 근거까지 한곳에서 확인하세요.
        </p>
        <p className="curation-note">
          <span>LAB TIMELINE SYNC</span>
          Circuit · AI · System · Archi · CV 분류와 BK 티어를 반영했습니다.
          <a
            aria-label="연구실 Timeline 원본 열기"
            href="https://verbena-heat-9b5.notion.site/Timeline-f8bcc599203845ccbbbfcae6e6dd7fca?pvs=73"
            rel="noreferrer"
            target="_blank"
          >
            원본 보기
          </a>
        </p>
      </div>
      <div className="hero-stats">
        <div>
          <strong>{editions.length}</strong>
          <span>등록 학회</span>
        </div>
        <div>
          <strong>{editions.filter((item) => item.status === "confirmed").length}</strong>
          <span>검증 완료</span>
        </div>
        <div>
          <strong>24h</strong>
          <span>점검 주기</span>
        </div>
      </div>
    </section>
  )
}

export function ErrorState({ message }: { readonly message: string }) {
  return (
    <div className="error-state" role="alert">
      <strong>데이터를 불러오지 못했습니다</strong>
      <span>{message}</span>
      <button onClick={() => window.location.reload()} type="button">
        다시 시도
      </button>
    </div>
  )
}

function Brand() {
  return (
    <a className="brand" href="/">
      <span>D</span>
      <strong>DEADLINE</strong>
    </a>
  )
}

function NavigationLinks({ methodId, label }: NavigationProps & { readonly label: string }) {
  return (
    <nav aria-label={label}>
      <a aria-current="page" href="/">
        일정 탐색
      </a>
      <a href={`#${methodId}`}>수집 원칙</a>
    </nav>
  )
}

function SourceStatus({ className }: { readonly className: string }) {
  return (
    <div className={className}>
      <span className="live-dot" />
      공식 출처 기반
    </div>
  )
}

export function SiteNavigation({ methodId }: NavigationProps) {
  return (
    <>
      <aside className="desktop-nav">
        <Brand />
        <NavigationLinks label="데스크톱 주요 메뉴" methodId={methodId} />
        <SourceStatus className="desktop-nav__meta" />
      </aside>
      <header className="site-header">
        <Brand />
        <NavigationLinks label="주요 메뉴" methodId={methodId} />
        <SourceStatus className="header-meta" />
      </header>
    </>
  )
}

export function MethodSection({ methodId }: NavigationProps) {
  const principles = [
    ["등록된 공식 출처", "임의 URL이 아니라 허용 목록의 학회 페이지와 제출 시스템만 확인합니다."],
    ["원문과 시간대 보존", "정규화된 UTC와 함께 원문 표기, 시간대, 확인 시점을 남깁니다."],
    ["변경은 검수 후 반영", "기존 일정이 달라지면 자동 덮어쓰기 없이 변경 이력으로 검토합니다."],
  ] as const
  return (
    <section className="method" id={methodId}>
      <p className="eyebrow">HOW IT WORKS</p>
      <h2>날짜보다 먼저 근거를 확인합니다</h2>
      <div>
        {principles.map(([title, description], index) => (
          <article key={title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export function SiteFooter() {
  return (
    <footer>
      <span>Deadline Observatory</span>
      <span>공식 출처 · 변경 감지 · 검수 가능한 기록</span>
    </footer>
  )
}
