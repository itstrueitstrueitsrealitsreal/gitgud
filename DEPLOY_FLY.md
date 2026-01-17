# Deploying to Fly.io

## Overview

Fly.io requires deploying **backend** and **frontend** as separate apps. Each has its own `fly.toml` configuration file.

---

## Prerequisites

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   # Or on macOS:
   brew install flyctl
   ```

2. **Login to Fly.io:**
   ```bash
   flyctl auth login
   ```

---

## Step 1: Deploy Backend

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Launch the app (first time only):**
   ```bash
   flyctl launch
   ```
   - When prompted:
     - **App name:** `gitgud-backend` (or your preferred name)
     - **Region:** Choose closest to you (e.g., `iad` for US East)
     - **Postgres/Redis:** No (unless you need them)
     - **Deploy now:** No (we'll set secrets first)

3. **Set secrets (environment variables):**
   ```bash
   flyctl secrets set OPENAI_API_KEY=sk-proj-your-key-here
   flyctl secrets set ELEVENLABS_API_KEY=sk_your-key-here
   flyctl secrets set GITHUB_CLIENT_ID=your-client-id
   flyctl secrets set GITHUB_CLIENT_SECRET=your-client-secret
   flyctl secrets set SESSION_SECRET=$(openssl rand -hex 32)
   flyctl secrets set OPENAI_MODEL=gpt-4o-mini
   flyctl secrets set LOG_LEVEL=info
   ```

4. **Set URL secrets (update after frontend deploys):**
   ```bash
   # Get your backend URL first
   flyctl status
   # Then set (replace with actual URL):
   flyctl secrets set BACKEND_URL=https://gitgud-backend.fly.dev
   flyctl secrets set FRONTEND_URL=https://gitgud-frontend.fly.dev
   flyctl secrets set ALLOWED_ORIGINS=https://gitgud-frontend.fly.dev
   ```

5. **Deploy:**
   ```bash
   flyctl deploy
   ```

6. **Get your backend URL:**
   ```bash
   flyctl status
   # Or check: https://fly.io/apps/gitgud-backend
   ```
   Copy the URL (e.g., `https://gitgud-backend.fly.dev`)

---

## Step 2: Deploy Frontend

1. **Navigate to frontend directory:**
   ```bash
   cd ../frontend
   ```

2. **Launch the app (first time only):**
   ```bash
   flyctl launch
   ```
   - When prompted:
     - **App name:** `gitgud-frontend` (or your preferred name)
     - **Region:** Same as backend (e.g., `iad`)
     - **Postgres/Redis:** No
     - **Deploy now:** No

3. **Set build argument for API URL:**
   ```bash
   # Use the backend URL from Step 1
   flyctl secrets set VITE_API_URL=https://gitgud-backend.fly.dev
   ```

4. **Update fly.toml build args:**
   The `frontend/fly.toml` already has `build_args = ["VITE_API_URL"]`, but you need to set it as a secret that Fly can use during build.

   Actually, Fly.io doesn't support build-time secrets the same way. You have two options:

   **Option A: Use environment variable (runtime):**
   - Frontend will read `VITE_API_URL` at runtime
   - Update your frontend code to read from `window.env.VITE_API_URL` or similar
   - Or use a config endpoint

   **Option B: Build with build arg (recommended):**
   ```bash
   # Deploy with build arg
   flyctl deploy --build-arg VITE_API_URL=https://gitgud-backend.fly.dev
   ```

   **Option C: Update Dockerfile to accept runtime env (easiest):**
   We can modify the frontend to read the API URL from a runtime environment variable instead of build-time.

5. **Deploy:**
   ```bash
   flyctl deploy --build-arg VITE_API_URL=https://gitgud-backend.fly.dev
   ```

6. **Get your frontend URL:**
   ```bash
   flyctl status
   ```
   Copy the URL (e.g., `https://gitgud-frontend.fly.dev`)

---

## Step 3: Update Backend CORS

After frontend is deployed, update backend secrets:

```bash
cd ../backend
flyctl secrets set FRONTEND_URL=https://gitgud-frontend.fly.dev
flyctl secrets set ALLOWED_ORIGINS=https://gitgud-frontend.fly.dev
```

Then redeploy backend:
```bash
flyctl deploy
```

---

## Step 4: Update GitHub OAuth

1. Go to https://github.com/settings/developers
2. Edit your OAuth App
3. Update **Authorization callback URL:**
   ```
   https://gitgud-backend.fly.dev/auth/github/callback
   ```

---

## Managing Secrets

**View all secrets:**
```bash
flyctl secrets list
```

**Remove a secret:**
```bash
flyctl secrets unset SECRET_NAME
```

**Update a secret:**
```bash
flyctl secrets set SECRET_NAME=new-value
```

---

## Viewing Logs

**Backend logs:**
```bash
cd backend
flyctl logs
```

**Frontend logs:**
```bash
cd frontend
flyctl logs
```

**Follow logs (real-time):**
```bash
flyctl logs -a gitgud-backend
flyctl logs -a gitgud-frontend
```

---

## Scaling

**Scale backend:**
```bash
cd backend
flyctl scale count 2  # Run 2 instances
flyctl scale vm shared-cpu-1x --memory 1024  # More memory
```

**Scale frontend:**
```bash
cd frontend
flyctl scale count 1
```

---

## Custom Domains

**Add domain to backend:**
```bash
cd backend
flyctl domains add api.yourdomain.com
```

**Add domain to frontend:**
```bash
cd frontend
flyctl domains add yourdomain.com
```

Fly.io automatically provisions SSL certificates.

---

## Troubleshooting

### Build Fails

**Check:**
1. Dockerfile exists in the directory
2. All dependencies are in package.json
3. Build logs: `flyctl logs`

### App Won't Start

**Check:**
1. Health check endpoint is working: `/health`
2. Port is correct (3000 for backend, 80 for frontend)
3. Environment variables are set: `flyctl secrets list`

### CORS Errors

**Fix:**
1. Make sure `ALLOWED_ORIGINS` includes frontend URL
2. Check backend logs for CORS errors
3. Verify `FRONTEND_URL` is set correctly

### Frontend Can't Connect to Backend

**Fix:**
1. Verify backend is running: `flyctl status -a gitgud-backend`
2. Check backend URL is correct in `VITE_API_URL`
3. Test backend directly: `curl https://gitgud-backend.fly.dev/health`

---

## Quick Commands Reference

```bash
# Deploy
flyctl deploy

# View status
flyctl status

# View logs
flyctl logs

# SSH into machine
flyctl ssh console

# Scale
flyctl scale count 2

# Secrets
flyctl secrets set KEY=value
flyctl secrets list
flyctl secrets unset KEY

# Open app in browser
flyctl open
```

---

## Cost

Fly.io has a generous free tier:
- **3 shared-cpu-1x VMs** (256MB RAM each)
- **3GB outbound data transfer** per month
- **160GB storage**

For your app:
- Backend: 1 VM (512MB RAM) - within free tier
- Frontend: 1 VM (256MB RAM) - within free tier
- **Total: Free!** 🎉

---

## Summary

1. Deploy backend from `backend/` directory
2. Deploy frontend from `frontend/` directory
3. Connect them via environment variables
4. Update CORS and OAuth URLs

That's it! Your app should be live on Fly.io! 🚀
