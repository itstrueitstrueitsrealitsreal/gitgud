# GitGud — Technical Requirements (Chrome Extension + Backend)

GitGud is a Chrome extension that analyzes a GitHub user/profile and generates:
1) a comedic roast,  
2) serious improvement advice,  
3) a “developer personality profile”,  
and can optionally speak the roast aloud using ElevenLabs TTS.

---

## Goals
- One-click “roast this GitHub” experience inside Chrome.
- Keep secrets server-side (OpenAI + ElevenLabs keys never shipped to the extension).
- No RAG / vector DB. Only GitHub APIs + LLM prompt + deterministic summarization.

---

## Non-Goals
- No private-repo analysis (unless later adding GitHub OAuth + explicit user consent).
- No long-term data storage of GitHub content beyond short-term caching.
- No multi-turn agent workflows; single request/response per roast.

---

## High-Level Architecture

### Components
- **Chrome Extension (Manifest V3)**
  - Popup UI (primary)
  - Optional content script on `github.com/*` to detect profiles and trigger roasts
  - Background service worker for orchestration + message passing
- **Backend API (Node.js + TypeScript + Fastify)**
  - `POST /roast`: fetch GitHub signals → call OpenAI Responses API → return structured JSON
  - `POST /tts`: convert roast text to audio using ElevenLabs TTS → return `audio/mpeg`

### Communication
- Extension popup/content script sends messages to extension background service worker using Chrome message passing APIs.
- Extension background service worker calls the backend over HTTPS.
- Backend calls:
  - GitHub REST API endpoints for users/repos/contents.
  - OpenAI Responses API (`POST /v1/responses`).
  - ElevenLabs “Create speech” Text-to-Speech endpoint.

---

## Backend Requirements

### Tech Stack
- Node.js 20+
- TypeScript
- Fastify (HTTP server)
- `@fastify/cors` enabled (extension calls backend from `chrome-extension://...`)
- Validation: `zod` (or equivalent)
- OpenAI: official Node SDK (`openai`) calling the Responses API
- GitHub + ElevenLabs: `fetch` for HTTP requests

### Environment Variables
- `OPENAI_API_KEY` (required)
- `ELEVENLABS_API_KEY` (required for TTS) — sent in `xi-api-key` header
- `GITHUB_TOKEN` (optional but recommended for rate limits)
- `ALLOWED_ORIGINS` (optional; allow-list for CORS)
- `PORT`

### Endpoints

#### `POST /roast`
**Purpose:** Produce roast + advice + profile based on GitHub signals.

Request JSON:
```json
{
  "username": "octocat",
  "intensity": "mild|medium|spicy",
  "includeReadme": true,
  "maxRepos": 5
}
```

Response JSON (success):
```json
{
  "request_id": "uuid",
  "username": "octocat",
  "signals": {
    "profile": { "public_repos": 8, "followers": 10, "created_at": "..." },
    "top_repos": [
      { "name": "x", "language": "TS", "stars": 1, "forks": 0, "updated_at": "..." }
    ]
  },
  "result": {
    "roast": "string",
    "advice": ["string"],
    "profile": {
      "archetype": "string",
      "strengths": ["string"],
      "blind_spots": ["string"]
    }
  }
}
```

Error JSON:
```json
{
  "error": {
    "code": "BAD_REQUEST|GITHUB_ERROR|OPENAI_ERROR|RATE_LIMIT",
    "message": "..."
  }
}
```

GitHub data collection (server-side):
- Fetch user: `GET /users/{username}`
- Fetch repos: `GET /users/{username}/repos?per_page=100&sort=updated`
- Optional README snippet for top repos using repository contents endpoints
- Backend MUST summarize GitHub data before sending to the LLM to control token usage (e.g., select top N repos by stars/recency).

OpenAI generation:
- Use OpenAI Responses API to generate text from `input` and return a Response object.
- Prompt constraints MUST enforce:
  - Output is strictly JSON (for deterministic UI rendering).
  - Roast is tech-focused and avoids doxxing / personal attribute guesses.
  - Advice must reference observed signals only (repos/languages/recency/etc.).
- Model selection should default to a cost-effective model; expose config for changing model without code changes (env var).

Caching & rate limits:
- Cache GitHub responses per username for 1–10 minutes to reduce GitHub rate-limit risk (in-memory LRU is fine).
- Cache OpenAI outputs per `(username, intensity)` for 1–10 minutes (optional).
- Implement a basic per-IP rate limiter to prevent abuse.

Observability:
- Log `request_id`, username, timing for:
  - GitHub fetch
  - OpenAI generation
  - ElevenLabs TTS (if invoked)
- Never log API keys or raw Authorization headers.

Security:
- Secrets never returned to client.
- Validate input lengths (username, maxRepos, text lengths).
- CORS allow-list in production (don’t allow `*` in final deployment).

---

#### `POST /tts`
**Purpose:** Convert text to audio for playback.

Request JSON:
```json
{
  "text": "string",
  "voiceId": "string",
  "modelId": "eleven_multilingual_v2"
}
```

Response:
- `200 OK`
- `Content-Type: audio/mpeg`
- Body: MP3 bytes

Constraints:
- Enforce `text` max length (e.g., 1–2000 chars).
- Sanitization: remove URLs/emails if you don’t want the voice reading them aloud (optional policy).

---

## Frontend Requirements (Chrome Extension)

### Tech Stack
- Manifest V3 extension
- UI: plain HTML/CSS/JS OR React (optional); keep it simple for demo
- Build tooling optional (Vite recommended if using React)

### Extension Modules

#### Popup UI
- Username input (auto-fill from current tab when on GitHub profile page)
- Intensity selector (mild/medium/spicy)
- Buttons:
  - “Roast me”
  - “Speak roast” (enabled after roast result)
- Panels:
  - Roast text
  - Serious advice list
  - Personality profile block

#### Background Service Worker
- Handles message passing from popup/content scripts.
- Calls backend endpoints (`/roast`, `/tts`)
- Returns results back to popup/content script
- Must keep async message channel alive (`return true` / use Promise-based handler) as required in MV3 patterns.

#### Optional Content Script (`github.com`)
- Detect profile pages
- Extract username from URL
- Inject “Roast this dev” button (optional)
- Send message to background service worker to trigger roast

### `manifest.json` Requirements
- `manifest_version: 3`
- `action.default_popup` set to popup
- `background.service_worker` set to background JS module
- Permissions:
  - `storage` (save backend URL, last username, voice choice)
- Host permissions:
  - Backend base URL (e.g., `https://your-backend.example/*`)
  - Optionally `https://github.com/*` if content script runs there

### State Management
Use `chrome.storage.local` to store:
- `backendUrl`
- `lastUsername`
- `lastIntensity`
- `voiceId`

### Messaging Contracts
Message types:
- `ROAST_REQUEST` → `{ username, intensity }`
- `ROAST_RESPONSE` → `{ request_id, result, signals }`
- `TTS_REQUEST` → `{ text, voiceId }`
- `TTS_RESPONSE` → `{ audioBytes | audioUrl }` (prefer bytes → Blob)

Audio playback:
- Popup receives audio bytes (or fetches from backend directly) and plays via `Audio` element.
- UX: show play/pause; disable “Speak” while generating.

---

## Feature List (MVP)

### MVP: Roast Generation
- Input GitHub username
- Fetch GitHub signals (profile + top repos)
- Generate:
  - Roast paragraph
  - 3–7 improvement bullets
  - Personality archetype + strengths + blind spots
- Display in popup

### MVP: TTS (ElevenLabs)
- “Speak roast” button
- Calls backend `/tts`
- Plays MP3 audio in popup (no download required)

### MVP: GitHub Page Convenience
- If current tab is `github.com/{user}`, auto-detect username and prefill.

---

## Nice-to-Haves (post-MVP)
- Streaming roast text (typing effect) and/or streaming TTS for lower perceived latency.
- Multi-voice selection UI + preview
- “Copy roast” / “Share roast” buttons
- Simple “report unsafe roast” feedback button (logs `request_id`)

---

## Acceptance Criteria
- Given a valid GitHub username, extension returns results in < 5–10 seconds on normal network.
- Roast output is valid JSON-parsable and renders reliably.
- TTS returns playable MP3 and plays in Chrome popup.
- No API keys are present in extension bundle or network responses.

---

## Open Questions (to finalize)
- Will the backend be public on the internet (required for a typical Chrome extension demo)?
- Should README fetching be enabled by default (more context, higher tokens) or opt-in?
- Which ElevenLabs voice ID should be the default for the demo?
