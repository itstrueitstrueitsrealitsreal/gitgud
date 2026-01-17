# Quick Start Guide - Docker

## Step 1: Create .env File

Copy the example environment file and fill in your credentials:

```bash
cp env.example .env
```

Then edit `.env` and add your actual API keys:

```env
# Required - Get these from your API providers
OPENAI_API_KEY=sk-proj-your-actual-key-here
ELEVENLABS_API_KEY=sk_your-actual-key-here

# Required for PVP mode - Get from GitHub OAuth App
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Required - Generate a random secret
SESSION_SECRET=e17d15f86452227cde27b4485514a0a00e303220a85aa86056bf15b1e39313c6

# URLs (for local testing, these are fine)
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
VITE_API_URL=http://localhost:3000

# Optional
GITHUB_TOKEN=your_github_token_optional
OPENAI_MODEL=gpt-4o-mini
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:80
LOG_LEVEL=info
NODE_ENV=production
```

**Quick tip**: Generate a new SESSION_SECRET with:
```bash
openssl rand -hex 32
```

## Step 2: Build and Start Containers

### Option A: Using Docker Compose (Recommended)

```bash
# Build and start in one command
docker-compose up -d --build
```

The `-d` flag runs containers in the background (detached mode).
The `--build` flag rebuilds images if needed.

### Option B: Using Makefile

```bash
# Build images
make build

# Start containers
make up

# Or rebuild and start in one command
make rebuild
```

## Step 3: Check Status

Verify containers are running:

```bash
docker-compose ps
```

You should see both `gitgud-backend` and `gitgud-frontend` with status "Up".

## Step 4: Test the Application

1. **Frontend**: Open http://localhost:80 in your browser
2. **Backend Health Check**: Visit http://localhost:3000/health
3. **Backend API Info**: Visit http://localhost:3000/

## Step 5: View Logs (if needed)

If something isn't working, check the logs:

```bash
# View all logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# View frontend logs only
docker-compose logs -f frontend
```

## Step 6: Test Features

1. **Offline Mode**:
   - Go to http://localhost:80
   - Enter two GitHub usernames
   - Click "Compare"
   - Wait for results

2. **PVP Mode** (if OAuth is configured):
   - Switch to "PVP Mode"
   - Click "Login with GitHub"
   - Authorize the app
   - Create or join a match

## Common Commands

```bash
# Stop containers
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Restart containers
docker-compose restart

# Rebuild after code changes
docker-compose up -d --build

# View container status
docker-compose ps

# Execute command in backend container
docker-compose exec backend sh

# Execute command in frontend container
docker-compose exec frontend sh
```

## Troubleshooting

### Containers won't start
1. Check if ports 80 and 3000 are available:
   ```bash
   lsof -i :80
   lsof -i :3000
   ```
2. If ports are in use, edit `docker-compose.yml` to use different ports

### Backend errors
1. Check backend logs: `docker-compose logs backend`
2. Verify all required environment variables are set in `.env`
3. Make sure `.env` file is in the project root (not in backend/)

### Frontend shows API errors
1. Check that backend is running: `docker-compose ps`
2. Verify `VITE_API_URL` in `.env` matches your backend URL
3. Check browser console for CORS errors

### OAuth not working
1. Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set
2. Check GitHub OAuth App callback URL is: `http://localhost:3000/auth/github/callback`
3. Check backend logs for OAuth errors

## Clean Up

To completely remove everything:

```bash
# Stop and remove containers, networks, and volumes
docker-compose down -v

# Remove images (optional)
docker rmi gitgud-backend gitgud-frontend
```

Or use the Makefile:
```bash
make clean
```
