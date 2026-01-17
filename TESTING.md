# Testing Guide

## Step 1: Check Container Status

First, verify that both containers are running:

```bash
docker-compose ps
```

You should see both `gitgud-backend` and `gitgud-frontend` with status "Up".

## Step 2: Check Container Logs

View the logs to see if there are any errors:

```bash
# View all logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# View frontend logs only
docker-compose logs -f frontend
```

## Step 3: Test Backend Health

Test if the backend is responding:

```bash
# Using curl
curl http://localhost:3000/health

# Or open in browser
open http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Step 4: Test Backend API Info

Check the API information endpoint:

```bash
curl http://localhost:3000/
```

Or open: http://localhost:3000/

## Step 5: Test Frontend

Open your browser and navigate to:

**http://localhost:80**

You should see the GitGud application interface.

## Step 6: Test Offline Mode

1. Go to http://localhost:80
2. Make sure "Offline Mode" is selected
3. Enter two GitHub usernames (e.g., `octocat` and `torvalds`)
4. Select a language
5. Click "Compare"
6. Wait for the AI to analyze and display results

## Step 7: Test Backend API Directly

Test the compare endpoint directly:

```bash
curl -X POST http://localhost:3000/compare \
  -H "Content-Type: application/json" \
  -d '{
    "username1": "octocat",
    "username2": "torvalds",
    "language": "en"
  }'
```

## Step 8: Test PVP Mode (if OAuth is configured)

1. Go to http://localhost:80
2. Click "PVP Mode"
3. Click "Login with GitHub"
4. You should be redirected to GitHub for authorization
5. After authorizing, you'll be redirected back
6. Create a match or join an existing one

## Step 9: Test Leaderboard

```bash
curl http://localhost:3000/leaderboard
```

Or check it in the frontend - it should be displayed at the bottom of the page.

## Troubleshooting

### Containers not starting

```bash
# Check what went wrong
docker-compose logs

# Restart containers
docker-compose restart

# Rebuild if needed
docker-compose up -d --build
```

### Backend not responding

1. Check backend logs: `docker-compose logs backend`
2. Verify environment variables are set in `.env`
3. Check if port 3000 is available: `lsof -i :3000`

### Frontend not loading

1. Check frontend logs: `docker-compose logs frontend`
2. Verify the frontend built successfully
3. Check if port 80 is available: `lsof -i :80`
4. Try accessing http://localhost directly

### API errors

1. Open browser developer tools (F12)
2. Check the Console tab for errors
3. Check the Network tab to see API requests
4. Verify `VITE_API_URL` in `.env` matches your backend URL

### CORS errors

If you see CORS errors in the browser console:
1. Check `ALLOWED_ORIGINS` in `.env`
2. Make sure it includes `http://localhost:80`
3. Restart the backend container

## Quick Test Script

Save this as `test.sh` and run it:

```bash
#!/bin/bash

echo "Testing GitGud Docker Setup..."
echo ""

echo "1. Checking containers..."
docker-compose ps
echo ""

echo "2. Testing backend health..."
curl -s http://localhost:3000/health | jq .
echo ""

echo "3. Testing API info..."
curl -s http://localhost:3000/ | jq '.name'
echo ""

echo "4. Testing leaderboard..."
curl -s http://localhost:3000/leaderboard | jq '.total_entries'
echo ""

echo "✅ Tests complete!"
echo ""
echo "Frontend: http://localhost:80"
echo "Backend: http://localhost:3000"
```

Make it executable and run:
```bash
chmod +x test.sh
./test.sh
```
