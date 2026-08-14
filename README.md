# 학회 마감 일정

공식 출처와 변경 이력을 함께 보여 주는 학회 일정 브라우저입니다. 공개 API와 웹은 읽기 전용이며, 수집과 검수는 로컬 운영자 명령으로만 수행합니다.

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

결정적 초기 데이터는 `data/seed`에, 실행 중 생성되는 데이터는 Git에서 제외된 `.local/runtime`에 둡니다. 실시간 크롤링은 등록된 소스 ID를 명시한 운영자 명령에서만 opt-in으로 실행되며, 테스트와 빌드는 네트워크에 접근하지 않습니다.

## 안전 경계

- 공개 API: 검색, 상세, 근거, 변경 이력 조회만 허용
- 운영자 명령: 등록된 소스 수집과 검수 처리
- 임의 URL, 브라우저 스크래핑, 로그인 우회는 지원하지 않음

## 수집 명령

기본 실행은 네트워크를 사용하지 않는 고정 fixture입니다.

```bash
bun packages/crawler/src/cli.ts crawl --source cui-2026-official
```

등록된 공식 소스를 실시간으로 확인할 때만 `--live`를 추가합니다. HTTPS, 정확한 허용 호스트, 공개 IP, `robots.txt`, 응답 형식, 2 MiB 크기, 10초 제한을 통과해야 수집됩니다. 현재 화면의 CUI 레코드는 재현 가능한 fixture/seed이며 실시간 최신값이라고 주장하지 않습니다.

## 배포 경계

`apps/web/dist`는 정적 호스팅에 올릴 수 있고 `/api`는 `apps/api`의 Hono 서버로 연결해야 합니다. 수집 명령은 공개 웹 프로세스와 분리해 운영자 환경에서 실행합니다. 클라우드 자격 증명과 배포 대상은 저장소에 포함하지 않습니다.
