# 자체 관리 서버 운영

공개 카탈로그는 계속 GitHub의 `data/seed/catalog-state.json`과 GitHub Pages가 담당한다. 이 서버는 자체 관리자 ID/PW 로그인, 추가·수정 요청, 검수 기록만 SQLite에 저장한다. 승인된 신규 학회만 주간 GitHub Actions가 읽어 검수 PR 후보로 만든다. 서버 DB가 공개 일정의 원본이 되지 않는다.

## 구성

| 경계 | 담당 |
| --- | --- |
| `https://skku-iris-lab.github.io/conference-deadlines/` | 읽기 전용 공개 페이지와 Manage 화면 |
| `https://manage.iris-lab.skku.edu` | 관리자 ID/PW 세션, SQLite 관리 요청 API |
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

   - Variable `VITE_MANAGEMENT_API_URL`: `https://manage.iris-lab.skku.edu`
   - Variable `MANAGEMENT_API_URL`: `https://manage.iris-lab.skku.edu`
   - Secret `MANAGEMENT_SYNC_TOKEN`: 서버 환경 파일의 동일한 값

3. systemd와 Caddy 설정을 반영한다.

```bash
sudo cp /srv/lab-infra/deploy/conference-deadlines@.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now conference-deadlines@conference-deadlines
cd /srv/lab-infra && ./proxy/px.sh reload
```

4. GitHub Pages를 한 번 다시 배포해 `VITE_MANAGEMENT_API_URL`을 번들에 넣는다. 이후 Manage 화면에서 `MANAGEMENT_ADMIN_USERNAME`과 비밀번호로 로그인한다.

## 요청 상태와 검수

`submitted`는 새 요청, `approved`는 운영자가 수집을 허용한 요청, `rejected`는 반려, `imported`는 향후 PR 병합 webhook이 기록할 상태다. 현재 주간 동기화는 `approved` 신규 학회만 읽는다. 일정 수기 수정은 서버와 감사 로그에 남지만, 공개 일정에 반영하는 UI는 별도 검수 PR 단계로 확장한다.

## 백업과 점검

- SQLite 파일: `/var/lib/conference-deadlines/management.sqlite`
- 백업: 서비스 중지 없이 `sqlite3 ... '.backup /안전한/백업경로/management.sqlite'`로 매일 복사한다.
- 상태 확인: `systemctl status conference-deadlines@conference-deadlines`
- API 확인: `curl https://manage.iris-lab.skku.edu/api/v1/health`

HTTPS가 아닌 주소에서는 교차 사이트 관리자 쿠키를 안전하게 쓸 수 없으므로 운영 환경에는 Caddy의 TLS 종료가 필수다.
