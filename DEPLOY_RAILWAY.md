# Deploying to Railway (Frontend + Backend)

## Overview

Railway supports Docker Compose, so you can deploy **both frontend and backend** in one deployment! This is the **easiest** option.

---

## Prerequisites

1. GitHub account (with your code pushed to a repository)
2. Railway account (free to sign up)

---

## Step-by-Step Deployment

### Step 1: Push Code to GitHub

If you haven't already:

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create repository on GitHub, then:
git remote add origin https://github.com/your-username/gitgud.git
git push -u origin main
```

### Step 2: Sign Up for Railway

1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (recommended - easier integration)

### Step 3: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `gitgud` repository
4. Railway will automatically detect your `docker-compose.yml`

### Step 4: Configure Services

Railway will detect both services from `docker-compose.yml`:
- `frontend` service
- `backend` service

You can configure them separately or Railway will handle both automatically.

### Step 5: Add Environment Variables

Go to your project → **Variables** tab, and add:

#### Required Variables:

```env
# OpenAI
OPENAI_API_KEY=sk-proj-your-actual-key-here

# ElevenLabs
ELEVENLABS_API_KEY=sk_your-actual-key-here

# Session Secret (generate a random 32+ character string)
SESSION_SECRET=your-random-secret-here-min-32-chars

# GitHub OAuth (for PVP mode - optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Node Environment
NODE_ENV=production
```

#### URL Variables (Railway will provide these):

After deployment, Railway will give you URLs. You'll need to:

1. **Get your Railway URLs:**
   - Railway provides a default domain like: `your-project.up.railway.app`
   - You can also add custom domains

2. **Set these variables:**
   ```env
   # Frontend URL (Railway will provide, or use custom domain)
   FRONTEND_URL=https://your-project.up.railway.app
   
   # Backend URL (same as frontend if using one domain, or separate)
   BACKEND_URL=https://your-project.up.railway.app
   
   # API URL for frontend (same as backend)
   VITE_API_URL=https://your-project.up.railway.app
   
   # CORS origins (allow your frontend domain)
   ALLOWED_ORIGINS=https://your-project.up.railway.app
   ```

**Note:** Railway exposes services on different ports internally. The frontend service will be accessible on port 80, and backend on port 3000. Railway handles routing automatically.

### Step 6: Configure Service Ports

Railway needs to know which ports your services use:

1. Go to **frontend** service → **Settings** → **Networking**
   - Set **Public Port** to `80` (or leave default)

2. Go to **backend** service → **Settings** → **Networking**
   - Set **Public Port** to `3000` (or leave default)

### Step 7: Update docker-compose.yml for Railway (Optional)

Railway works with your existing `docker-compose.yml`, but you might want to ensure the frontend build arg is set:

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
    args:
      - VITE_API_URL=${VITE_API_URL:-http://localhost:3000}
```

Railway will automatically use environment variables, so this should work as-is.

### Step 8: Deploy!

1. Railway will automatically start building when you:
   - Push to your GitHub repository, OR
   - Click **"Deploy"** in the Railway dashboard

2. Watch the build logs in Railway dashboard

3. Once deployed, Railway will provide you with:
   - Frontend URL (e.g., `https://your-project.up.railway.app`)
   - Backend URL (if separate, or same URL with different routing)

### Step 9: Configure Routing (If Needed)

If Railway creates separate URLs for frontend and backend:

**Option A: Use Railway's built-in routing**
- Railway can route `/api/*` to backend
- Frontend serves from root `/`

**Option B: Use one domain with Nginx (already configured in frontend)**
- Your frontend's `nginx.conf` already proxies `/api` to backend
- This should work automatically

### Step 10: Update GitHub OAuth (If Using PVP)

1. Go to https://github.com/settings/developers
2. Edit your OAuth App
3. Update **Authorization callback URL** to:
   ```
   https://your-project.up.railway.app/auth/github/callback
   ```
4. Update `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in Railway if needed

---

## Railway-Specific Configuration

### Using Railway's Default Domain

Railway provides a default domain like:
- `your-project-production.up.railway.app`

You can use this directly, or add a custom domain.

### Adding Custom Domain

1. Go to your project → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `gitgud.com`)
4. Railway provides DNS records to add
5. Railway automatically provisions SSL certificate

### Environment Variables Priority

Railway uses environment variables in this order:
1. Service-specific variables (highest priority)
2. Project-level variables
3. Variables from `.env` file (if present)

**Recommendation:** Set variables at the **project level** so both services can access them.

---

## Testing Your Deployment

1. **Check Health:**
   ```
   https://your-project.up.railway.app/health
   ```

2. **Test Frontend:**
   ```
   https://your-project.up.railway.app
   ```

3. **Test API:**
   ```
   https://your-project.up.railway.app/api/info
   ```

4. **Test Comparison:**
   - Open frontend
   - Enter two GitHub usernames
   - Test the comparison feature

5. **Test PVP (if configured):**
   - Click "PVP Mode"
   - Test GitHub login
   - Create/join a match

---

## Railway Features

### Auto-Deploy from GitHub

Railway automatically deploys when you push to your main branch:
- Push to `main` → Auto-deploy
- Push to other branches → Create preview deployments

### Logs

View logs in Railway dashboard:
- Real-time logs
- Search and filter
- Download logs

### Metrics

Railway provides:
- CPU usage
- Memory usage
- Network traffic
- Request metrics

### Scaling

Railway can:
- Auto-scale based on traffic
- Manual scaling (change instance size)
- Horizontal scaling (multiple instances)

---

## Cost

### Free Tier:
- $5 credit per month
- Enough for small projects

### Paid Plans:
- **Hobby:** $5/month (after free credit)
- **Pro:** $20/month (more resources)

**For your app:** Free tier should be sufficient for testing/small scale.

---

## Troubleshooting

### Build Fails

**Check:**
1. Build logs in Railway dashboard
2. Ensure all environment variables are set
3. Check Dockerfile syntax
4. Verify `docker-compose.yml` is valid

### Services Not Starting

**Check:**
1. Service logs in Railway dashboard
2. Environment variables are correct
3. Ports are configured correctly
4. Health checks are passing

### CORS Errors

**Fix:**
1. Ensure `ALLOWED_ORIGINS` includes your Railway domain
2. Check `FRONTEND_URL` is set correctly
3. Verify backend CORS configuration

### Frontend Can't Connect to Backend

**Fix:**
1. Ensure `VITE_API_URL` is set correctly
2. Check that backend service is running
3. Verify nginx.conf is proxying correctly
4. Check Railway networking settings

---

## Quick Start Checklist

- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] Project created from GitHub repo
- [ ] Environment variables added
- [ ] Service ports configured
- [ ] Deployed successfully
- [ ] Health check passing
- [ ] Frontend accessible
- [ ] Backend API working
- [ ] GitHub OAuth updated (if using PVP)
- [ ] Custom domain added (optional)

---

## Advantages of Railway

✅ **One deployment** for frontend + backend  
✅ **Automatic SSL** certificates  
✅ **Auto-deploy** from GitHub  
✅ **Easy environment variable** management  
✅ **Built-in monitoring** and logs  
✅ **Simple scaling**  
✅ **Good free tier**  
✅ **No server management** needed  

---

## Next Steps

1. Deploy to Railway using steps above
2. Test all features
3. Add custom domain (optional)
4. Set up monitoring/alerts (optional)
5. Configure auto-scaling if needed (optional)

---

## Alternative: Separate Services

If you want frontend and backend as separate Railway services:

1. Create two separate services in Railway
2. Deploy frontend Dockerfile to one service
3. Deploy backend Dockerfile to another service
4. Configure networking between them
5. Set environment variables for each

But using `docker-compose.yml` is **much easier** and recommended!
