# IRIS Conference Deadline Mattermost Bot

Mattermost의 `/conf` 명령을 받아 공개된 IRIS Conference Deadline 카탈로그만 조회하는 Cloudflare Worker입니다. 이 Worker는 Firebase·GitHub 저장소·카탈로그 데이터를 수정하지 않습니다.

## Local check

```bash
cp .dev.vars.example .dev.vars
bun run dev
```

Mattermost가 보내는 것과 같은 형식으로 호출합니다.

```bash
curl -X POST http://127.0.0.1:8787/mattermost/command \
  -H "Authorization: Token $MATTERMOST_COMMAND_TOKEN" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "text=DAC 일정 알려줘"
```

## Deploy

```bash
bunx wrangler login
bunx wrangler secret put MATTERMOST_COMMAND_TOKEN
bun run deploy
```

Cloudflare가 출력한 `https://iris-conference-deadline-bot.<account>.workers.dev/mattermost/command` 주소를 Mattermost의 Custom Slash Command Request URL로 설정합니다. Trigger Word는 `conf`, Request Method는 `POST`로 둡니다.
