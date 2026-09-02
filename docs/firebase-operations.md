# Firebase 운영 연결

GitHub Pages는 읽기 전용 정적 사이트이므로, 관리자 입력은 Firebase Authentication과 Cloud Firestore에만 기록한다. 공개 카탈로그는 계속 `data/seed/catalog-state.json`에서 빌드되며, Firebase의 요청이 검수 없이 공개 일정이나 자동 수집값을 덮어쓰지 않는다.

## 한 번만 할 설정

1. Firebase Console에서 프로젝트를 만들고 **Authentication → Sign-in method → Google**을 활성화한다.
2. **Firestore Database**를 production mode로 만든다. 이 저장소의 [`firestore.rules`](../firestore.rules)를 Rules 탭에 붙여 넣거나 Firebase CLI로 배포한다.
3. Google Cloud Console에서 Web OAuth client를 만들고 Authorized JavaScript origin에 `https://judenause.github.io`와 로컬 개발 origin을 추가한다. Client ID만 사용하며 Client secret은 저장소나 Pages에 넣지 않는다.
4. GitHub 저장소 **Settings → Secrets and variables → Actions → Variables**에 아래 세 값을 추가한다. 모두 공개 웹 설정이므로 Secrets가 아니라 Variables를 사용한다.

   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_GOOGLE_CLIENT_ID`

5. `main`에 다음 배포가 일어난 뒤 페이지의 **Manage → 학회 관리**에서 Google로 한 번 로그인한다. 이 첫 로그인은 Firebase Authentication의 Users 화면에 사용자 UID를 만든다. 아직 관리자 문서가 없으므로 저장 요청이 거부되는 것은 정상이다.
6. Firebase Authentication의 Users 화면에서 사용자 UID를 확인한다. Firestore Console에서 문서 ID가 UID와 같은 `adminUsers/{UID}` 문서를 만들고 `enabled: true`(boolean) 필드를 추가한다. 이 문서가 관리자 권한의 유일한 기준이다. 페이지를 새로고침해 다시 로그인하면 추가·수정 요청을 저장할 수 있다.

## 신규 학회 월간 자동 등록을 켜는 추가 설정

관리자 요청을 월간 GitHub Actions가 읽어 검수 PR로 만드는 단계는 서버 자격증명이 필요하다. 이 값은 웹 번들에 넣지 않고 GitHub Actions Secret으로만 사용한다.

1. Google Cloud Console에서 현재 Firebase 프로젝트를 선택하고 **IAM 및 관리자 → 서비스 계정**으로 이동한다.
2. `conference-deadline-sync` 같은 서비스 계정을 만들고 **Cloud Datastore Viewer** 역할만 부여한다. 이 workflow는 `conferenceRequests`를 읽기만 한다.
3. 서비스 계정의 **Keys → Add key → Create new key → JSON**으로 키를 한 번 내려받는다.
4. GitHub 저장소 **Settings → Secrets and variables → Actions → Secrets**에서 아래 Secret을 만든다.

   - 이름: `FIREBASE_SERVICE_ACCOUNT_JSON`
   - 값: 내려받은 JSON 파일의 전체 내용

5. JSON 파일은 GitHub에 파일로 커밋하지 말고, Secret 등록 후 로컬에서도 삭제한다.
6. 다음 월간 실행부터 `conferenceRequests`의 `submitted` 요청을 공식 URL로 확인하고, 추출된 일정이 포함된 검수 후보를 카탈로그에 추가한 뒤 자동 PR을 만든다. PR을 병합해야 Pages에 공개된다.

워크플로는 `google-github-actions/auth`로 서비스 계정 키를 인증하고 Google Cloud SDK에서 단기 Datastore 토큰을 발급한다. 따라서 이 방식에서는 IAM Credentials API를 별도로 활성화하거나 서비스 계정에 Token Creator 역할을 추가할 필요가 없다. 장기적으로는 키 JSON 대신 Workload Identity Federation으로 전환하는 것이 더 안전하다.

서비스 계정 Secret이 없으면 월간 workflow는 기존 공식 URL 모니터링만 수행하고 신규 요청 동기화는 건너뛴다.

## 저장되는 데이터와 검수 규칙

`conferenceRequests`는 이름·공식 URL·분야를 담는 신규 학회 후보이다. `scheduleOverrides`는 기존 학회 일정의 수기 수정 제안과 근거 URL을 담는다. 둘 다 처음에는 `submitted`이고, 자동 동기화가 후보를 만들더라도 운영자가 공식 URL과 추출 결과를 확인해 PR을 병합하기 전에는 공개 카탈로그를 바꾸지 않는다.

월간 GitHub Actions는 `FIREBASE_SERVICE_ACCOUNT_JSON`이 설정된 경우 `conferenceRequests`의 신규 요청을 먼저 확인한다. HTTPS 공식 URL에 접근할 수 있으면 일정 후보를 포함한 검수용 에디션을 만들고, 이후 현재 카탈로그의 모든 공식 URL을 점검한다. 리디렉션·본문 변경·접근 불가와 “미래 에디션에 과거 일정만 남은 상태”를 검수 PR로 기록한다. 공식 HTML에서 날짜를 명확히 추출할 수 있는 경우에는 기존 트랙과 일치하는 일정 변경을 근거와 함께 같은 PR에 자동 제안한다. 운영자가 PR을 검토·병합한 결과만 `data/seed/catalog-state.json`에 반영되어 Pages에 배포된다.

이 경계 덕분에 수기 값은 자동 관측값과 별도로 남고, 크롤러가 수기 수정을 되돌리지 않는다. Firestore 보안 규칙은 공개 쓰기를 허용하지 않으며 `adminUsers/{UID}`가 있는 로그인 사용자만 요청을 읽거나 쓸 수 있다.
