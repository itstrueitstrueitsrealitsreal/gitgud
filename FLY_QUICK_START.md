# Fly.io Quick Start

## ⚠️ IMPORTANT: Run commands from the correct directory!

Fly.io needs to find the Dockerfile. You **MUST** run `flyctl launch` from the directory containing the Dockerfile.

---

## Quick Deploy Steps

### 1. Deploy Backend

**CRITICAL: Start in the backend directory!**

```bash
# Navigate to backend directory FIRST
cd backend

# Verify Dockerfile exists
ls Dockerfile  # Should show: Dockerfile

# Now launch (this will create/update fly.toml)
flyctl launch
```

**When prompted:**
- **App name:** `gitgud-backend` (or your preferred name)
- **Region:** Choose closest (e.g., `iad` for US East, `sjc` for US West)
- **Postgres:** No
- **Redis:** No
- **Deploy now:** No (we'll set secrets first)

**After launch, set secrets:**
```bash
# Still in backend/ directory
flyctl secrets set OPENAI_API_KEY=sk-proj-your-key-here
flyctl secrets set ELEVENLABS_API_KEY=sk_your-key-here
flyctl secrets set GITHUB_CLIENT_ID=your-client-id
flyctl secrets set GITHUB_CLIENT_SECRET=your-client-secret
flyctl secrets set SESSION_SECRET=$(openssl rand -hex 32)
flyctl secrets set OPENAI_MODEL=gpt-4o-mini
flyctl secrets set LOG_LEVEL=info
```

**Get backend URL:**
```bash
flyctl status
# Copy the URL (e.g., https://gitgud-backend.fly.dev)
```

**Deploy:**
```bash
flyctl deploy
```

### 2. Deploy Frontend

**CRITICAL: Start in the frontend directory!**

```bash
# Navigate to frontend directory
cd ../frontend

# Verify Dockerfile exists
ls Dockerfile  # Should show: Dockerfile

# Now launch
flyctl launch
```

**When prompted:**
- **App name:** `gitgud-frontend` (or your preferred name)
- **Region:** Same as backend (e.g., `iad`)
- **Postgres:** No
- **Redis:** No
- **Deploy now:** No

**Deploy with build arg (use backend URL from step 1):**
```bash
# Still in frontend/ directory
# Replace with your actual backend URL
flyctl deploy --build-arg VITE_API_URL=https://gitgud-backend.fly.dev
```

**Get frontend URL:**
```bash
flyctl status
# Copy the URL (e.g., https://gitgud-frontend.fly.dev)
```

### 3. Update Backend CORS

```bash
# Go back to backend directory
cd ../backend

# Update secrets with frontend URL
flyctl secrets set FRONTEND_URL=https://gitgud-frontend.fly.dev
flyctl secrets set ALLOWED_ORIGINS=https://gitgud-frontend.fly.dev
flyctl secrets set BACKEND_URL=https://gitgud-backend.fly.dev

# Redeploy backend
flyctl deploy
```

### 3. Update Backend CORS

```bash
cd ../backend
flyctl secrets set FRONTEND_URL=https://gitgud-frontend.fly.dev
flyctl secrets set ALLOWED_ORIGINS=https://gitgud-frontend.fly.dev
flyctl deploy
```

---

## Why This Works

- Each service has its own `fly.toml` in its directory
- `flyctl launch` detects the `fly.toml` and Dockerfile
- Fly.io builds and deploys each service independently

---

## Full Guide

See `DEPLOY_FLY.md` for complete instructions with troubleshooting.
