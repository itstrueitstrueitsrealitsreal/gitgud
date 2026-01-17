# GitHub OAuth Setup Guide

To enable PVP mode, you need to set up GitHub OAuth authentication.

## Step 1: Create a GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **"New OAuth App"** (or "Register a new application" if you don't have any)
3. Fill in the form:
   - **Application name**: `GitGud` (or any name you prefer)
   - **Homepage URL**: `http://localhost:3000` (or your production URL)
   - **Authorization callback URL**: `http://localhost:3000/auth/github/callback` ⚠️ **IMPORTANT: This must match exactly**
4. Click **"Register application"**
5. You'll see a page with your **Client ID** and **Client Secret**
   - ⚠️ **Copy these immediately** - you won't be able to see the secret again!

## Step 2: Add to .env file

Add these lines to your `backend/.env` file:

```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
SESSION_SECRET=your_random_secret_string_here
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

**Important Notes:**
- Replace `your_client_id_here` with your actual Client ID from GitHub
- Replace `your_client_secret_here` with your actual Client Secret from GitHub
- Replace `your_random_secret_string_here` with a random string (e.g., use `openssl rand -hex 32` to generate one)
- The `SESSION_SECRET` is used to encrypt session cookies - use a strong random string

## Step 3: Restart the backend server

After adding the credentials, restart your backend server:

```bash
cd backend
npm run dev
```

## Step 4: Test

1. Go to your frontend (http://localhost:5173)
2. Click "PVP Mode"
3. Click "Login with GitHub"
4. You should be redirected to GitHub to authorize the app
5. After authorizing, you'll be redirected back to the app

## Troubleshooting

### 404 Error on `/auth/github`
- Make sure `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set in your `.env` file
- Make sure you restarted the backend server after adding the credentials
- Check the backend console for any error messages

### "redirect_uri_mismatch" Error
- Make sure the Authorization callback URL in your GitHub OAuth App is exactly: `http://localhost:3000/auth/github/callback`
- Make sure `BACKEND_URL` in your `.env` matches your actual backend URL

### Session Issues
- Make sure `SESSION_SECRET` is set to a random string
- In production, use a strong random secret (at least 32 characters)

## Production Setup

For production:
1. Create a new OAuth App with your production URL
2. Set `FRONTEND_URL` and `BACKEND_URL` to your production URLs
3. Use a strong `SESSION_SECRET` (generate with `openssl rand -hex 32`)
4. Make sure `SESSION_SECRET` is kept secure and never committed to git
