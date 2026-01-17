# Deploying to Vercel (Frontend) + Backend Service

## Strategy: Split Deployment

Since Vercel doesn't support Docker Compose, we'll:
- **Frontend:** Deploy to Vercel (perfect for React/Vite)
- **Backend:** Deploy to Railway, Render, or Fly.io (Docker support)

---

## Step 1: Deploy Backend First

Choose one of these platforms:

### Option A: Railway (Recommended - Easiest)

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will detect `docker-compose.yml`
6. Add environment variables in Railway dashboard:
   - `OPENAI_API_KEY`
   - `ELEVENLABS_API_KEY`
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `SESSION_SECRET`
   - `FRONTEND_URL` (you'll set this after Vercel deployment)
   - `BACKEND_URL` (Railway will provide this)
   - `VITE_API_URL` (same as BACKEND_URL)
   - `ALLOWED_ORIGINS` (you'll set this after Vercel deployment)
7. Railway will build and deploy automatically
8. Copy your backend URL (e.g., `https://gitgud-backend.railway.app`)

### Option B: Render

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Settings:
   - **Name:** `gitgud-backend`
   - **Environment:** Docker
   - **Dockerfile Path:** `backend/Dockerfile`
   - **Docker Context:** `backend`
6. Add environment variables
7. Deploy!
8. Copy your backend URL

### Option C: Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Create app
cd backend
fly launch

# Set secrets
fly secrets set OPENAI_API_KEY=...
fly secrets set ELEVENLABS_API_KEY=...
# ... etc

# Deploy
fly deploy
```

---

## Step 2: Deploy Frontend to Vercel

### Method 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd frontend

# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Set production environment variable
vercel env add VITE_API_URL production
# Enter your backend URL when prompted (e.g., https://gitgud-backend.railway.app)

# Deploy to production
vercel --prod
```

### Method 2: Vercel Dashboard

1. Go to https://vercel.com
2. Sign up/login with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Add Environment Variable:
   - **Key:** `VITE_API_URL`
   - **Value:** Your backend URL (e.g., `https://gitgud-backend.railway.app`)
7. Click "Deploy"

---

## Step 3: Update Backend CORS

After Vercel deployment, you'll get a frontend URL like `https://gitgud.vercel.app`

1. Go to your backend platform (Railway/Render/Fly.io)
2. Update environment variable:
   - `FRONTEND_URL=https://gitgud.vercel.app`
   - `ALLOWED_ORIGINS=https://gitgud.vercel.app`
3. Restart backend service

---

## Step 4: Update GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Edit your OAuth App (or create a new one for production)
3. Update:
   - **Authorization callback URL:** `https://your-backend-url/auth/github/callback`
4. Update `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in backend environment variables

---

## Environment Variables Summary

### Backend (Railway/Render/Fly.io):
```env
OPENAI_API_KEY=sk-proj-...
ELEVENLABS_API_KEY=sk_...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
SESSION_SECRET=...
FRONTEND_URL=https://gitgud.vercel.app
BACKEND_URL=https://your-backend.railway.app
VITE_API_URL=https://your-backend.railway.app
ALLOWED_ORIGINS=https://gitgud.vercel.app
NODE_ENV=production
```

### Frontend (Vercel):
```env
VITE_API_URL=https://your-backend.railway.app
```

---

## Testing After Deployment

1. **Frontend:** Visit `https://gitgud.vercel.app`
2. **Backend Health:** `https://your-backend.railway.app/health`
3. **Test Comparison:** Try comparing two GitHub users
4. **Test PVP:** If OAuth is configured, test PVP mode

---

## Custom Domains

### Vercel (Frontend):
1. Go to Vercel dashboard → Your project → Settings → Domains
2. Add your domain (e.g., `gitgud.com`)
3. Vercel provides SSL automatically
4. Update DNS records as instructed

### Backend:
- **Railway:** Add custom domain in project settings
- **Render:** Add custom domain in service settings
- **Fly.io:** `fly domains add your-domain.com`

Then update:
- `FRONTEND_URL` to your custom domain
- `BACKEND_URL` to your backend custom domain
- `VITE_API_URL` to your backend custom domain
- `ALLOWED_ORIGINS` to your frontend custom domain

---

## Alternative: All-in-One Deployment (Easier)

If you don't want to split deployments, use **Railway** or **Render** for everything:

1. Deploy entire `docker-compose.yml` to Railway
2. Both frontend and backend in one place
3. Simpler setup, one deployment

**Railway is recommended** - it's the easiest for Docker Compose deployments.

---

## Cost Comparison

| Platform | Free Tier | Paid Tier |
|----------|-----------|-----------|
| **Vercel** | ✅ Generous | $20/month |
| **Railway** | ✅ $5 credit | ~$5-10/month |
| **Render** | ✅ Limited* | ~$7/month |
| **Fly.io** | ✅ Generous | Pay-as-you-go |

*Render free tier spins down after inactivity

---

## Recommendation

**Best Option:** **Vercel (Frontend) + Railway (Backend)**
- ✅ Fast frontend delivery via Vercel's CDN
- ✅ Reliable backend on Railway
- ✅ Both have good free tiers
- ✅ Easy to set up

**Simplest Option:** **Railway for Everything**
- ✅ One deployment
- ✅ Less configuration
- ✅ Still very fast
