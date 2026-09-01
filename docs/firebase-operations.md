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

## 저장되는 데이터와 검수 규칙

`conferenceRequests`는 이름·공식 URL·분야를 담는 신규 학회 후보이다. `scheduleOverrides`는 기존 학회 일정의 수기 수정 제안과 근거 URL을 담는다. 둘 다 처음에는 `submitted`이고, 운영자가 공식 URL을 확인해 승인하기 전에는 공개 카탈로그를 바꾸지 않는다.

월간 GitHub Actions는 현재 카탈로그의 모든 공식 URL을 점검하고, 리디렉션·본문 변경·접근 불가와 “미래 에디션에 과거 일정만 남은 상태”를 검수 PR로 기록한다. 공식 HTML에서 날짜를 명확히 추출할 수 있는 경우에는 기존 트랙과 일치하는 일정 변경을 근거와 함께 같은 PR에 자동 제안한다. Firestore 관리자 요청은 이 검수 흐름의 입력이며, 운영자가 공식 URL을 확인해 PR을 병합한 결과만 `data/seed/catalog-state.json`에 반영되어 Pages에 배포된다.

이 경계 덕분에 수기 값은 자동 관측값과 별도로 남고, 크롤러가 수기 수정을 되돌리지 않는다. Firestore 보안 규칙은 공개 쓰기를 허용하지 않으며 `adminUsers/{UID}`가 있는 로그인 사용자만 요청을 읽거나 쓸 수 있다.
