# SpeakUp

A free public communication practice tool — pick a speaking category, get an AI-generated topic, prep for 30 seconds, record yourself, and receive structured AI coaching feedback.

## Run & Operate

```bash
# Start API server (runs automatically via workflow)
pnpm --filter @workspace/api-server run dev   # node artifacts/api-server/server.js

# Start web frontend (runs automatically via workflow)
pnpm --filter @workspace/speakup-web run dev  # Vite dev server
```

Required env vars (auto-provisioned via Replit AI integration):
- `AI_INTEGRATIONS_GEMINI_BASE_URL` — Replit Gemini proxy base URL
- `AI_INTEGRATIONS_GEMINI_API_KEY`  — Replit Gemini proxy key

## Stack

- **Runtime**: Node.js 24
- **Package manager**: pnpm (workspace monorepo)
- **API server**: Express 5, plain CJS (`artifacts/api-server/server.js`), no build step
- **AI**: Google Gemini `gemini-2.5-flash` via `@google/genai` + Replit AI integrations proxy
- **Frontend**: Single-file HTML/CSS/JS (`artifacts/speakup-web/index.html`) served by Vite
- **Rate limiting**: `express-rate-limit` — 20 req/IP/hour on `/api/speakup`

## Where things live

```
artifacts/api-server/
├── server.js          ← Express API (entry point, CJS)
└── package.json

artifacts/speakup-web/
├── index.html         ← Complete 5-screen SPA (HTML/CSS/JS, no framework)
└── vite.config.ts     ← Vite config (serves static HTML, no React plugin)
```

## Architecture Decisions

- **Two-artifact split**: `speakup-web` (kind=web, path=`/`) serves the static SPA via Vite; `api-server` (kind=api, path=`/api`) runs Express — clean separation of concerns.
- **No framework on frontend**: Vanilla HTML/CSS/JS to keep it simple and load fast with no build step.
- **Replit AI integrations proxy**: User's own Gemini/OpenAI keys had quota exhaustion; switched to Replit's managed proxy (`AI_INTEGRATIONS_GEMINI_BASE_URL` + `AI_INTEGRATIONS_GEMINI_API_KEY`) billed through Replit credits.
- **`app.set('trust proxy', 1)`**: Required so `express-rate-limit` correctly reads client IP behind Replit's reverse proxy.

## Product

1. **Home** — 8 topic category cards (+ custom) displayed in a grid
2. **Topic** — AI-generated thought-provoking prompt; refresh for another
3. **Prep Timer** — 30-second animated countdown
4. **Recording** — Live speech-to-text via Web Speech API; stop when done
5. **Feedback** — AI returns filler words, clarity score, pace, structure, tip, encouragement

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/healthz` | Health check |
| POST | `/api/speakup/topic` | Generate speaking topic for a category |
| POST | `/api/speakup/feedback` | Analyze transcript, return coaching JSON |

## Gotchas

- The workflow for `api-server` runs `node server.js` from `artifacts/api-server/` — NOT from the workspace root. Always edit `artifacts/api-server/server.js`.
- Gemini integration env vars are auto-set by Replit; never hard-code or override them.
