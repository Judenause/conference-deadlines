import type { Edition } from "@conf/contracts"
import { Icon } from "./Icons"

interface NavigationProps {
  readonly theme: "light" | "dark"
  readonly onToggleTheme: () => void
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
          Notion 108개 전 항목과 Circuit · AI · System · Archi · CV 분류를 반영했습니다.
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
          <strong>
            {
              editions
                .flatMap((item) => item.deadlines)
                .filter((item) => item.status === "confirmed").length
            }
          </strong>
          <span>검증 마감</span>
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

function NavigationLinks({ label }: { readonly label: string }) {
  return (
    <nav aria-label={label}>
      <a aria-current="page" href="/">
        일정 탐색
      </a>
    </nav>
  )
}

function SourceStatus({ className }: { readonly className: string }) {
  return (
    <div className={className}>
      <span className="live-dot" />
      공식 URL 병기
    </div>
  )
}

function ThemeToggle({ theme, onToggleTheme }: NavigationProps) {
  const isDark = theme === "dark"
  return (
    <button
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      aria-pressed={isDark}
      className="theme-toggle"
      onClick={onToggleTheme}
      type="button"
    >
      <Icon name={isDark ? "sun" : "moon"} />
      <span>{isDark ? "라이트" : "다크"}</span>
    </button>
  )
}

export function SiteNavigation({ theme, onToggleTheme }: NavigationProps) {
  return (
    <>
      <aside className="desktop-nav">
        <Brand />
        <NavigationLinks label="데스크톱 주요 메뉴" />
        <div className="desktop-nav__tools">
          <ThemeToggle onToggleTheme={onToggleTheme} theme={theme} />
          <SourceStatus className="desktop-nav__meta" />
        </div>
      </aside>
      <header className="site-header">
        <Brand />
        <NavigationLinks label="주요 메뉴" />
        <div className="header-tools">
          <ThemeToggle onToggleTheme={onToggleTheme} theme={theme} />
          <SourceStatus className="header-meta" />
        </div>
      </header>
    </>
  )
}

export function SiteFooter() {
  return (
    <footer>
      <span>Deadline Observatory</span>
      <span>제출 마감 · 학회 기간 · 공식 사이트</span>
    </footer>
  )
}
