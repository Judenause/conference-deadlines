# 학회 마감 일정

공식 출처와 변경 이력을 함께 보여 주는 학회 일정 브라우저입니다. 공개 일정은 읽기 전용이며, 수집과 검수는 운영자 흐름으로만 수행합니다.

현재 정적 카탈로그에는 연구실 Notion Timeline의 108개 레코드(Circuit 27, AI 27, System 30, Archi 9, CV 15)가 모두 포함됩니다. 각 학회는 `논문 제출`과 `학회 개최`를 분리해 보여 주며 공식 사이트 주소를 항상 함께 표시합니다. Notion에 시간대가 없는 날짜는 AoE로 임시 계산하고 `시간대 검수 필요` 상태로 공개합니다.

## 개발 명령

```bash
bun install
bun run dev
bun run doctor
```

파일 감시가 제한된 서버에서는 두 터미널에서 production surface를 실행할 수 있습니다.

```bash
bun apps/api/src/server.ts
bun --filter @conf/web build && bun --filter @conf/web preview
```

결정적 초기 데이터는 `data/seed`에, 실행 중 생성되는 데이터는 Git에서 제외된 `.local/runtime`에 둡니다. 단일 소스의 실시간 크롤링은 등록된 소스 ID를 명시한 운영자 명령에서 opt-in으로 실행합니다. GitHub Actions는 30일 이내 마감을 매일 점검하고 전체 카탈로그는 매주 점검합니다. 테스트와 빌드는 네트워크에 접근하지 않습니다.

## 안전 경계

- 공개 API: 검색, 상세, 근거, 변경 이력 조회만 허용
- 운영자 명령: 등록된 소스 수집과 검수 처리
- 임의 URL, 브라우저 스크래핑, 로그인 우회는 지원하지 않음

웹의 **Manage** 화면은 자체 관리 서버에서 Google 관리자 인증 후 학회 추가와 수기 일정 수정 요청을 저장합니다. 이 요청은 검수 전까지 공개 카탈로그를 바꾸지 않으며, 공개 데이터의 최종 원본은 계속 Git PR입니다. [자체 관리 서버 운영](docs/management-server-operations.md)을 따라 설정합니다.

## 수집 명령

기본 실행은 네트워크를 사용하지 않는 고정 fixture입니다.

```bash
bun packages/crawler/src/cli.ts crawl --source cui-2026-official
```

등록된 공식 소스를 실시간으로 확인할 때만 `--live`를 추가합니다. HTTPS, 정확한 허용 호스트, 공개 IP, `robots.txt`, 응답 형식, 2 MiB 크기, 10초 제한을 통과해야 수집됩니다. 현재 화면의 CUI 레코드는 재현 가능한 fixture/seed이며 실시간 최신값이라고 주장하지 않습니다.

모니터는 공식 HTML에서 명확한 일정 라벨과 날짜를 찾으면 기존 트랙과 일치하는 변경안을 `data/seed/catalog-state.json`에 제안하고, 근거와 함께 검수 PR을 만듭니다. 30일 이내 마감은 매일, 전체 카탈로그는 매주 점검합니다. 시간대가 없으면 AoE 임시 계산과 `시간대 검수 필요` 상태로 제안하며, 같은 종류의 트랙이 여러 개이거나 날짜 형식이 모호하면 자동 변경하지 않습니다.

## 배포 경계

기본 웹 빌드의 `/api`는 `apps/api`의 Hono 서버로 연결합니다. Pages 전용 빌드는 아래와 같이 검수된 데이터를 정적 파일로 포함합니다. 수집 명령은 공개 웹 프로세스와 분리해 운영자 환경에서 실행합니다.

## GitHub Pages

Pages 배포에서는 읽기 전용 카탈로그를 정적 JSON으로 포함하므로 별도 API 서버가 필요하지 않습니다.

```bash
bun run build:pages
```

GitHub 저장소의 `Settings → Pages → Source`를 `GitHub Actions`로 선택하면 `main` 브랜치 갱신 시 `.github/workflows/pages.yml`이 사이트를 자동 배포합니다. 운영자가 검수한 `data/seed/catalog-state.json`이 공개 데이터가 되며, 라이브 크롤링 결과는 검수 없이 자동 게시하지 않습니다.

## 일일·주간 공식 URL 점검

`.github/workflows/daily-deadline-monitor.yml`은 매일 09:00 KST에 30일 이내 제출 마감이 있는 학회의 공식 URL만 확인합니다. `.github/workflows/monthly-source-monitor.yml`은 매주 월요일 03:00 KST에 전체 카탈로그를 확인합니다. URL 이동, 콘텐츠 변경, 접근 불가 상태와 미래 에디션에 과거 일정만 남은 상태는 `data/monitor` 검수 PR에 기록합니다. 공식 HTML에서 추출한 일정 변경은 근거와 함께 같은 PR에 제안됩니다. `confirmed` 시간대, 0.98 이상 신뢰도, 동일 공식 호스트, 관련 콘텐츠 변경만 모두 만족한 일일 변경은 테스트·빌드 후 자동 병합하며, 그 외에는 운영자가 검토해 병합해야 Pages에 게시됩니다.

첫 수동 실행은 GitHub의 `Actions → weekly-source-monitor → Run workflow`에서 시작합니다. 초기 실행은 모든 공식 URL의 기준 fingerprint를 기록하는 검수 PR을 하나 만듭니다.
