# GitGud Backend

Backend API server for GitGud - GitHub Developer Comparison Platform

## Features

- **Offline Mode**: Compare any two GitHub users without authentication
- **PVP Mode**: Live player vs player battles with GitHub OAuth authentication
- AI-powered roasts and comparisons
- Leaderboard tracking
- Multi-language support

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
GITHUB_TOKEN=your_github_token_here  # Optional but recommended
GITHUB_CLIENT_ID=your_github_oauth_client_id  # Required for PVP mode
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret  # Required for PVP mode
SESSION_SECRET=your_random_session_secret  # Required for PVP mode (use a random string)
FRONTEND_URL=http://localhost:5173  # Frontend URL for OAuth redirects
BACKEND_URL=http://localhost:3000  # Backend URL for OAuth callbacks
PORT=3000
OPENAI_MODEL=gpt-4o-mini
ALLOWED_ORIGINS=http://localhost:5173
```

**Note**: To enable PVP mode, you need to:
1. Create a GitHub OAuth App at https://github.com/settings/developers
2. Set the Authorization callback URL to: `http://localhost:3000/auth/github/callback` (or your production URL)
3. Copy the Client ID and Client Secret to your `.env` file

3. Build the project:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

Or run in development mode with hot reload:
```bash
npm run dev
```

## API Endpoints

### POST /roast

Generate a roast, advice, and personality profile for a GitHub user.

**Request:**
```json
{
  "username": "octocat",
  "intensity": "mild",
  "includeReadme": false,
  "maxRepos": 5
}
```

**Response:**
```json
{
  "request_id": "uuid",
  "username": "octocat",
  "signals": {
    "profile": {
      "public_repos": 8,
      "followers": 10,
      "created_at": "2011-01-25T18:44:36Z"
    },
    "top_repos": [...]
  },
  "result": {
    "roast": "...",
    "advice": ["..."],
    "profile": {
      "archetype": "...",
      "strengths": ["..."],
      "blind_spots": ["..."]
    }
  }
}
```

### POST /tts

Convert text to speech using ElevenLabs.

**Request:**
```json
{
  "text": "Your roast text here",
  "voiceId": "voice-id",
  "modelId": "eleven_multilingual_v2"
}
```

**Response:**
- Content-Type: `audio/mpeg`
- Body: MP3 audio bytes

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### POST /compare

Compare two GitHub users and determine a winner.

**Request:**
```json
{
  "username1": "user1",
  "username2": "user2",
  "language": "en"
}
```

### GET /auth/github

Start GitHub OAuth flow (redirects to GitHub).

### GET /auth/github/callback

GitHub OAuth callback (handles OAuth redirect).

### GET /auth/me

Get current authenticated user session.

**Response:**
```json
{
  "user": {
    "githubId": "12345",
    "username": "octocat",
    "accessToken": "...",
    "avatarUrl": "https://..."
  }
}
```

### POST /auth/logout

Logout current user.

### POST /pvp/create

Create a new PVP match (requires authentication).

**Request:**
```json
{
  "username": "octocat"
}
```

### POST /pvp/join

Join an existing PVP match (requires authentication).

**Request:**
```json
{
  "matchId": "uuid",
  "username": "octocat"
}
```

### GET /pvp/match/:matchId

Get match status.

### POST /pvp/ready/:matchId

Mark player as ready (requires authentication).

### GET /pvp/my-match

Get current user's active match (requires authentication).

## Features

- **Caching**: GitHub responses cached for 5 minutes, OpenAI results cached for 10 minutes
- **Rate Limiting**: 10 requests per minute per IP address
- **CORS**: Configurable allowed origins
- **Logging**: Request IDs, timing information, and error logging
- **Validation**: Input validation using Zod schemas

## Environment Variables

- `OPENAI_API_KEY` (required): OpenAI API key
- `ELEVENLABS_API_KEY` (required): ElevenLabs API key
- `GITHUB_TOKEN` (optional): GitHub personal access token for higher rate limits
- `GITHUB_CLIENT_ID` (required for PVP): GitHub OAuth App Client ID
- `GITHUB_CLIENT_SECRET` (required for PVP): GitHub OAuth App Client Secret
- `SESSION_SECRET` (required for PVP): Random secret string for session encryption
- `FRONTEND_URL` (optional): Frontend URL for OAuth redirects (default: http://localhost:5173)
- `BACKEND_URL` (optional): Backend URL for OAuth callbacks (default: http://localhost:3000)
- `PORT` (optional): Server port (default: 3000)
- `OPENAI_MODEL` (optional): OpenAI model to use (default: gpt-4o-mini)
- `ALLOWED_ORIGINS` (optional): Comma-separated list of allowed CORS origins
- `LOG_LEVEL` (optional): Logging level (default: info)
- `NODE_ENV` (optional): Environment (development/production)
