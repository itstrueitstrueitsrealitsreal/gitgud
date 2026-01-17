# Deployment Guide

This guide explains how to deploy GitGud using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- A `.env` file with all required environment variables

## Quick Start

1. **Create a `.env` file** in the project root:
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

2. **Build and start the services**:
   ```bash
   docker-compose up -d --build
   ```

3. **Check the logs**:
   ```bash
   docker-compose logs -f
   ```

4. **Stop the services**:
   ```bash
   docker-compose down
   ```

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Required
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
SESSION_SECRET=your_random_session_secret

# URLs - Update these for production!
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
VITE_API_URL=http://localhost:3000

# Optional
GITHUB_TOKEN=your_github_token
OPENAI_MODEL=gpt-4o-mini
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:80
LOG_LEVEL=info
NODE_ENV=production
```

**Important for Production:**
- Set `FRONTEND_URL` to your production frontend URL (e.g., `https://gitgud.example.com`)
- Set `BACKEND_URL` to your production backend URL (e.g., `https://api.gitgud.example.com`)
- Set `VITE_API_URL` to your production backend URL (used by frontend to call API)
- Update the GitHub OAuth App callback URL to match your production backend URL
- Use a strong `SESSION_SECRET` (generate with `openssl rand -hex 32`)

## Production Deployment

### 1. Update Environment Variables

Update your `.env` file with production values:

```env
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
VITE_API_URL=https://api.yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com
NODE_ENV=production
```

### 2. Update GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Edit your OAuth App
3. Update the Authorization callback URL to: `https://api.yourdomain.com/auth/github/callback`

### 3. Build for Production

```bash
docker-compose -f docker-compose.yml build --no-cache
```

### 4. Deploy

```bash
docker-compose up -d
```

## Using a Reverse Proxy (Recommended for Production)

For production, it's recommended to use a reverse proxy (like Nginx or Traefik) in front of your containers. Here's an example setup:

### Option 1: Nginx as Reverse Proxy

Create an `nginx-proxy.conf`:

```nginx
upstream backend {
    server backend:3000;
}

upstream frontend {
    server frontend:80;
}

server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend routes
    location ~ ^/(auth|pvp|compare|translate|leaderboard|roast|tts|health) {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Option 2: Update docker-compose.yml for Reverse Proxy

Add an nginx service to your `docker-compose.yml`:

```yaml
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro  # For SSL certificates
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    networks:
      - gitgud-network
```

## Docker Commands

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart services
```bash
docker-compose restart
docker-compose restart backend
docker-compose restart frontend
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Stop and remove containers
```bash
docker-compose down
```

### Stop and remove containers + volumes
```bash
docker-compose down -v
```

### Execute commands in containers
```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh
```

## Health Checks

Both services include health checks. Check status:

```bash
docker-compose ps
```

## Troubleshooting

### Backend won't start
1. Check logs: `docker-compose logs backend`
2. Verify environment variables are set correctly
3. Check if port 3000 is already in use: `lsof -i :3000`

### Frontend shows API errors
1. Verify `VITE_API_URL` is set correctly in `.env`
2. Check backend is running: `docker-compose ps`
3. Check CORS settings in backend
4. Verify `ALLOWED_ORIGINS` includes your frontend URL

### OAuth not working
1. Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set
2. Check GitHub OAuth App callback URL matches `BACKEND_URL`
3. Check backend logs for OAuth errors

### Port conflicts
If ports 80 or 3000 are already in use, update `docker-compose.yml`:

```yaml
ports:
  - "8080:80"  # Frontend
  - "3001:3000"  # Backend
```

Then update `FRONTEND_URL` and `BACKEND_URL` accordingly.

## Security Considerations

1. **Never commit `.env` files** - They contain sensitive credentials
2. **Use strong SESSION_SECRET** - Generate with `openssl rand -hex 32`
3. **Enable HTTPS in production** - Use a reverse proxy with SSL certificates
4. **Set proper CORS origins** - Don't use wildcards in production
5. **Keep Docker images updated** - Regularly update base images
6. **Use secrets management** - Consider using Docker secrets or external secret managers for production

## Scaling

To scale the backend:

```bash
docker-compose up -d --scale backend=3
```

Note: You'll need a load balancer in front for this to work properly.

## Monitoring

Consider adding monitoring services:

- **Prometheus + Grafana** for metrics
- **ELK Stack** for log aggregation
- **Health check endpoints** are already included

## Backup

Backup your environment file:

```bash
cp .env .env.backup
```

The application uses in-memory storage for leaderboard and PVP matches, so consider adding persistent storage if needed.
