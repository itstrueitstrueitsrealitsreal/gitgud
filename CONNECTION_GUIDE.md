# How to Connect Frontend to Backend

## Quick Start

### Option 1: Development (Recommended)

**Terminal 1 - Backend:**
```bash
cd backend
npm install  # if you haven't already
npm run dev
```
Backend runs on: `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install  # if you haven't already
npm run dev
```
Frontend runs on: `http://localhost:5173`

The frontend will automatically connect to `http://localhost:3000` for API calls.

### Option 2: Using Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:3000
```

Or for a remote backend:
```env
VITE_API_URL=https://your-backend-domain.com
```

## How It Works

### Development Mode

1. **Backend** runs on port `3000` and serves:
   - API endpoints: `/compare`, `/translate`, `/leaderboard`, etc.
   - CORS is enabled to allow requests from `http://localhost:5173`

2. **Frontend** runs on port `5173` and:
   - Makes API calls directly to `http://localhost:3000`
   - Uses the `API_BASE` constant defined in `App.tsx`

### API Endpoints Used

The frontend calls these backend endpoints:

- `POST /compare` - Compare two GitHub users
- `POST /translate` - Translate text
- `GET /leaderboard` - Get leaderboard
- `GET /leaderboard/:username` - Get user stats

### CORS Configuration

The backend is configured to allow requests from:
- `http://localhost:5173` (Vite dev server)
- Any origin if `ALLOWED_ORIGINS` is not set (development only)

To restrict in production, set in backend `.env`:
```env
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

## Production Setup

### Build Frontend

```bash
cd frontend
npm run build
```

This creates a `dist` folder with the production build.

### Option A: Serve Frontend from Backend

The backend is already configured to serve static files from `frontend/dist`:

1. Build the frontend: `cd frontend && npm run build`
2. Start the backend: `cd backend && npm start`
3. Access everything at: `http://localhost:3000`

### Option B: Separate Servers

1. Deploy backend to one server (e.g., `https://api.gitgud.com`)
2. Deploy frontend to another server (e.g., `https://gitgud.com`)
3. Set `VITE_API_URL=https://api.gitgud.com` in frontend `.env`
4. Build frontend: `npm run build`
5. Deploy the `dist` folder

## Troubleshooting

### CORS Errors

If you see CORS errors:
1. Make sure backend is running
2. Check that `ALLOWED_ORIGINS` in backend `.env` includes your frontend URL
3. Or leave it empty for development (allows all origins)

### Connection Refused

If you see "connection refused":
1. Make sure backend is running on port 3000
2. Check `API_BASE` in `App.tsx` matches your backend URL
3. Check firewall/network settings

### API Not Found (404)

1. Make sure backend routes are registered in `backend/src/index.ts`
2. Check that you're using the correct endpoint paths
3. Verify backend is running and logs show routes registered

## Testing the Connection

1. Start both servers
2. Open browser console (F12)
3. Go to `http://localhost:5173`
4. Try comparing two users
5. Check Network tab to see API calls to `http://localhost:3000`

## Example API Call

The frontend makes calls like this:

```typescript
const response = await fetch(`${API_BASE}/compare`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username1: 'octocat',
    username2: 'torvalds',
    language: 'en',
  }),
});
```

Where `API_BASE` is `http://localhost:3000` in development.
