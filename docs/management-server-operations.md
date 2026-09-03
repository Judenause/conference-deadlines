# 자체 관리 서버 운영

공개 카탈로그는 계속 GitHub의 `data/seed/catalog-state.json`과 GitHub Pages가 담당한다. 이 서버는 자체 관리자 ID/PW 로그인, 추가·수정 요청, 검수 기록만 SQLite에 저장한다. 승인된 신규 학회만 주간 GitHub Actions가 읽어 검수 PR 후보로 만든다. 서버 DB가 공개 일정의 원본이 되지 않는다.

## 구성

| 경계 | 담당 |
| --- | --- |
| `https://skku-iris-lab.github.io/conference-deadlines/` | 읽기 전용 공개 페이지와 Manage 화면 |
| Tailscale Funnel의 HTTPS URL | 관리자 ID/PW 세션, SQLite 관리 요청 API |
| GitHub Actions | 승인된 신규 요청 수집, 검수 PR, 테스트, Pages 배포 |

## 한 번만 할 설정

1. 서버에서 다음 파일을 만들고 권한을 제한한다.

```bash
sudo install -d -m 700 /etc/conference-deadlines
sudo cp /srv/lab-infra/deploy/conference-deadlines/_example.env \
  /etc/conference-deadlines/conference-deadlines.env
sudo chmod 600 /etc/conference-deadlines/conference-deadlines.env
sudoedit /etc/conference-deadlines/conference-deadlines.env
```

`MANAGEMENT_ADMIN_PASSWORD_HASH`와 `MANAGEMENT_SYNC_TOKEN`은 이 파일 밖에 복사하거나 Git에 넣지 않는다. 비밀번호 해시는 아래처럼 Argon2id로 만든다.

```bash
read -rsp "관리자 비밀번호: " MANAGEMENT_PASSWORD; echo
MANAGEMENT_PASSWORD="$MANAGEMENT_PASSWORD" /home/jhso/.bun/bin/bun -e 'console.log(await Bun.password.hash(process.env.MANAGEMENT_PASSWORD!, { algorithm: "argon2id" }))'
unset MANAGEMENT_PASSWORD
```

2. GitHub 저장소 Settings → Secrets and variables → Actions에 다음을 설정한다.

   - Variable `VITE_MANAGEMENT_API_URL`: 현재 Funnel URL. 예: `https://iris-dashboard.jaglion-major.ts.net:10000`
   - Variable `MANAGEMENT_API_URL`: 같은 Funnel URL
   - Secret `MANAGEMENT_SYNC_TOKEN`: 서버 환경 파일의 동일한 값

3. systemd 설정을 반영한다. Funnel을 사용하면 Caddy 설정은 필요 없다.

```bash
sudo cp /srv/lab-infra/deploy/conference-deadlines@.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now conference-deadlines@conference-deadlines
```

4. GitHub Pages를 한 번 다시 배포해 `VITE_MANAGEMENT_API_URL`을 번들에 넣는다. 이후 `#/manage`에서 `MANAGEMENT_ADMIN_USERNAME`과 비밀번호로 로그인한다.

## 관리 화면에서 검수 PR 만들기

관리 화면의 **검수 PR 만들기**는 `weekly-source-monitor` GitHub Actions를 시작한다. Action이 변경점을 검수 PR로 만들고, **병합은 GitHub에서 사람이 직접** 한다. 서버가 `main`을 직접 병합하지 않는다.

이를 쓰려면 GitHub 조직에서 GitHub App을 한 번 만들고 `conference-deadlines` 저장소에만 설치한다. App의 Repository permissions에서 **Actions: Read and write**를 부여하고 webhook은 끈다. App ID, 해당 저장소 installation ID, 생성한 private key를 서버 환경 파일에만 넣는다.

```ini
GITHUB_APP_ID=123456
GITHUB_APP_INSTALLATION_ID=12345678
GITHUB_APP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GITHUB_REPOSITORY=SKKU-IRIS-Lab/conference-deadlines
```

private key는 GitHub에서 다시 표시되지 않으므로 내려받은 직후 서버에만 보관하고, Git이나 GitHub Actions Secret에 넣지 않는다. 환경 파일을 바꾼 뒤 `sudo systemctl restart conference-deadlines@conference-deadlines`를 실행한다.

## 요청 상태와 검수

`submitted`는 새 요청, `approved`는 운영자가 수집을 허용한 요청, `rejected`는 반려, `imported`는 향후 PR 병합 webhook이 기록할 상태다. 현재 주간 동기화는 `approved` 신규 학회만 읽는다. 일정 수기 수정은 서버와 감사 로그에 남지만, 공개 일정에 반영하는 UI는 별도 검수 PR 단계로 확장한다.

## 백업과 점검

- SQLite 파일: `/var/lib/conference-deadlines/management.sqlite`
- 백업: 서비스 중지 없이 `sqlite3 ... '.backup /안전한/백업경로/management.sqlite'`로 매일 복사한다.
- 상태 확인: `systemctl status conference-deadlines@conference-deadlines`
- API 확인: `curl https://iris-dashboard.jaglion-major.ts.net:10000/api/v1/health`

HTTPS가 아닌 주소에서는 교차 사이트 관리자 쿠키를 안전하게 쓸 수 없으므로 운영 환경에는 Funnel 또는 Caddy 같은 TLS 종료가 필요하다.
