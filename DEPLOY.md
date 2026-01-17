# Deployment Guide: Vercel (Frontend) + Render (Backend)

## Overview

- **Frontend:** Deploy to Vercel (React/Vite app)
- **Backend:** Deploy to Render (Docker container)

---

## Step 1: Deploy Backend to Render

### 1.1 Create Render Account

1. Go to https://render.com
2. Sign up/login with GitHub

### 1.2 Create Web Service

1. Click **"New"** → **"Web Service"**
2. Connect your GitHub repository
3. Select your `gitgud` repository

### 1.3 Configure Service

**Basic Settings:**
- **Name:** `gitgud-backend`
- **Region:** Choose closest to you (e.g., `Oregon (US West)`)
- **Branch:** `main` (or your default branch)
- **Root Directory:** `backend`
- **Runtime:** `Docker`
- **Dockerfile Path:** `Dockerfile` (relative to root directory)
- **Docker Context:** `backend`

**Note:** Render will look for `backend/Dockerfile` automatically when Root Directory is set to `backend`.

### 1.4 Environment Variables

Add these in Render dashboard → **Environment** tab:

```env
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=sk-proj-your-key-here
ELEVENLABS_API_KEY=sk_your-key-here
GITHUB_TOKEN=your-github-token (optional)
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
SESSION_SECRET=your-random-32-char-secret
OPENAI_MODEL=gpt-4o-mini
LOG_LEVEL=info
# URLs - update after frontend deploys
FRONTEND_URL=https://your-app.vercel.app
BACKEND_URL=https://gitgud-backend.onrender.com
ALLOWED_ORIGINS=https://your-app.vercel.app
```

**Generate SESSION_SECRET:**
```bash
openssl rand -hex 32
```

### 1.5 Deploy

1. Click **"Create Web Service"**
2. Render will build and deploy automatically
3. Wait for deployment to complete
4. Copy your backend URL (e.g., `https://gitgud-backend.onrender.com`)

**Note:** Render free tier spins down after 15 minutes of inactivity. First request after spin-down may take 30-60 seconds.

---

## Step 2: Deploy Frontend to Vercel

### Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend directory
cd frontend

# Login to Vercel
vercel login

# Deploy (first time)
vercel

# When prompted:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? gitgud-frontend
# - Directory? ./
# - Override settings? No

# Set environment variable
vercel env add VITE_API_URL production
# Enter your Render backend URL when prompted:
# https://gitgud-backend.onrender.com

# Deploy to production
vercel --prod
```

### Option B: Vercel Dashboard

1. Go to https://vercel.com
2. Sign up/login with GitHub
3. Click **"Add New Project"**
4. Import your GitHub repository
5. **Configure:**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
6. **Environment Variables:**
   - Click **"Environment Variables"**
   - Add: `VITE_API_URL` = `https://gitgud-backend.onrender.com`
7. Click **"Deploy"**

### 2.1 Get Frontend URL

After deployment, Vercel provides a URL like:
- `https://gitgud-frontend.vercel.app`
- Or custom domain if configured

---

## Step 3: Update Backend CORS

After Vercel deployment, update backend environment variables in Render:

1. Go to Render dashboard → Your backend service
2. Go to **Environment** tab
3. Update:
   - `FRONTEND_URL` = `https://gitgud-frontend.vercel.app` (your Vercel URL)
   - `ALLOWED_ORIGINS` = `https://gitgud-frontend.vercel.app`
   - `BACKEND_URL` = `https://gitgud-backend.onrender.com` (your Render URL)
4. Click **"Save Changes"**
5. Render will automatically redeploy

---

## Step 4: Update GitHub OAuth (If Using PVP)

1. Go to https://github.com/settings/developers
2. Edit your OAuth App (or create new one)
3. Update **Authorization callback URL:**
   ```
   https://gitgud-backend.onrender.com/auth/github/callback
   ```
4. Update `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in Render if needed

---

## Testing

1. **Frontend:** Visit your Vercel URL
2. **Backend Health:** `https://gitgud-backend.onrender.com/health`
3. **Test Comparison:** Try comparing two GitHub users
4. **Test PVP:** If OAuth is configured, test PVP mode

---

## Custom Domains

### Vercel (Frontend)

1. Go to Vercel dashboard → Your project → Settings → Domains
2. Add your domain (e.g., `gitgud.com`)
3. Vercel provides SSL automatically
4. Update DNS records as instructed

### Render (Backend)

1. Go to Render dashboard → Your service → Settings
2. Click **"Custom Domains"**
3. Add your domain (e.g., `api.gitgud.com`)
4. Render provides SSL automatically
5. Update DNS records as instructed

Then update:
- `FRONTEND_URL` in Render to your custom domain
- `BACKEND_URL` in Render to your backend custom domain
- `VITE_API_URL` in Vercel to backend custom domain
- `ALLOWED_ORIGINS` in Render to frontend custom domain

---

## Environment Variables Summary

### Backend (Render):
```env
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=sk-proj-...
ELEVENLABS_API_KEY=sk_...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
SESSION_SECRET=...
OPENAI_MODEL=gpt-4o-mini
LOG_LEVEL=info
FRONTEND_URL=https://gitgud-frontend.vercel.app
BACKEND_URL=https://gitgud-backend.onrender.com
ALLOWED_ORIGINS=https://gitgud-frontend.vercel.app
```

### Frontend (Vercel):
```env
VITE_API_URL=https://gitgud-backend.onrender.com
```

---

## Troubleshooting

### Render Backend Not Starting

**Check:**
1. Build logs in Render dashboard
2. Environment variables are set correctly
3. Dockerfile exists in `backend/` directory
4. Port is set to 3000

### CORS Errors

**Fix:**
1. Make sure `ALLOWED_ORIGINS` includes your Vercel URL
2. Check `FRONTEND_URL` is set correctly in Render
3. Verify backend CORS configuration

### Frontend Can't Connect to Backend

**Fix:**
1. Verify `VITE_API_URL` is set in Vercel
2. Check backend is running: Visit `https://gitgud-backend.onrender.com/health`
3. Check browser console for errors
4. Note: Render free tier spins down after inactivity - first request may be slow

### Render Spins Down

**Render free tier limitation:**
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Consider upgrading to paid plan for always-on service

---

## Cost

### Free Tier:
- **Vercel:** ✅ Generous free tier
- **Render:** ✅ Free tier (spins down after inactivity)

### Paid Options:
- **Vercel:** $20/month (Pro plan)
- **Render:** $7/month (Starter plan - always on)

**For production:** Consider Render Starter plan ($7/month) to avoid spin-down delays.

---

## Quick Reference

### Render Commands (via Dashboard)
- View logs: Dashboard → Service → Logs
- View metrics: Dashboard → Service → Metrics
- Update env vars: Dashboard → Service → Environment
- Manual deploy: Dashboard → Service → Manual Deploy

### Vercel Commands
```bash
# Deploy
vercel --prod

# View logs
vercel logs

# Open in browser
vercel open
```

---

## Summary

1. ✅ Deploy backend to Render (Docker)
2. ✅ Deploy frontend to Vercel (Vite)
3. ✅ Connect via environment variables
4. ✅ Update CORS and OAuth URLs

**Total setup time: ~15 minutes**

Your app is now live! 🚀
