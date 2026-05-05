# SpeakUp

## Overview

A free public communication practice tool. Pick a speaking category, get an AI-generated topic, prep for 30 seconds, record yourself speaking, and receive structured AI coaching feedback.

## Stack

- **Runtime**: Node.js 24
- **Package manager**: pnpm (workspace monorepo)
- **Server**: Express 5 — plain JavaScript (`server.js`), no build step
- **AI**: OpenAI `gpt-4o-mini` via the `openai` npm package
- **Frontend**: Single-file HTML/CSS/JS (`public/index.html`) — no framework, no bundler
- **Rate limiting**: `express-rate-limit` — 20 requests per IP per hour

## Project Structure

```
artifacts/api-server/
├── server.js          ← Express backend (entry point)
├── package.json       ← Dependencies + start/dev scripts
└── public/
    └── index.html     ← Complete frontend (5-screen SPA)
```

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/healthz` | Health check |
| POST | `/api/speakup/topic` | Generate a speaking topic for a category |
| POST | `/api/speakup/feedback` | Analyze speech transcript and return coaching |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Required. OpenAI API key (set as Replit Secret) |
| `PORT` | Server port. Defaults to `3000` if not set |

## Running Locally

```bash
node server.js
# or via pnpm:
pnpm --filter @workspace/api-server run dev
```

## Key Commands

- `pnpm --filter @workspace/api-server run dev` — start the server
- `pnpm --filter @workspace/api-server run start` — same as dev (node server.js)

## App Flow

1. **Home** — Choose from 8 topic categories (or type your own)
2. **Topic** — AI generates a thought-provoking prompt; refresh for another
3. **Prep Timer** — 30-second animated countdown to gather thoughts
4. **Recording** — Live speech-to-text via Web Speech API; stop when done
5. **Feedback** — AI returns: filler words, clarity score, pace, structure, tip, encouragement
