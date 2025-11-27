# Docker Setup for Egg9 Frontend

## Two Dockerfiles Explained

### `Dockerfile` - Production (Railway)
**Used for:** Railway deployment, production builds

**What it does:**
- Builds static files with `expo export`
- Serves with production HTTP server (`serve`)
- Optimized for performance
- Listens on Railway's dynamic PORT

**How Railway uses it:**
```bash
docker build -f Dockerfile .
docker run -p $PORT:$PORT
```

### `Dockerfile.dev` - Development (Local)
**Used for:** Local docker-compose development

**What it does:**
- Starts Expo development server
- Hot reload enabled
- Metro bundler for fast refresh
- Development mode features

**How docker-compose uses it:**
```bash
docker-compose up frontend
# Uses Dockerfile.dev automatically
```

---

## Usage

### Local Development:
```bash
# From project root
docker-compose up

# Frontend runs on:
# - http://localhost:19006 (Web)
# - http://localhost:8081 (Metro bundler)
```

### Production (Railway):
Railway automatically:
1. Detects `Dockerfile` (not `Dockerfile.dev`)
2. Builds production image
3. Runs with environment variables from Railway dashboard

---

## Environment Variables

### Local (.env):
```bash
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_APP_ENV=development
```

### Production (Railway Dashboard):
```bash
EXPO_PUBLIC_API_URL=https://your-backend.up.railway.app/api
EXPO_PUBLIC_APP_ENV=production
```

---

## Why Two Dockerfiles?

| Feature | Development (Dockerfile.dev) | Production (Dockerfile) |
|---------|------------------------------|-------------------------|
| Hot Reload | ✅ Yes | ❌ No |
| Build Time | Fast | Slower (optimized) |
| Bundle Size | Large | Small (minified) |
| Debug Tools | ✅ Enabled | ❌ Disabled |
| Performance | Lower | Higher |
| Use Case | Local dev | Railway deployment |

---

## Common Commands

```bash
# Local development
docker-compose up frontend

# Rebuild after dependency changes
docker-compose up --build frontend

# Production build (test locally)
docker build -f Dockerfile -t egg9-frontend-prod .
docker run -p 8081:8081 -e PORT=8081 egg9-frontend-prod

# Railway
# Just push to git - Railway uses Dockerfile automatically
git push
```

---

## Troubleshooting

### 502 Error on Railway?
- Check Railway build logs
- Verify `Dockerfile` (not `Dockerfile.dev`) is being used
- Ensure `PORT` environment variable is set
- Check `expo export` succeeded in build logs

### Local development not working?
- Ensure using `docker-compose up` (uses `Dockerfile.dev`)
- Check volumes are mounted correctly
- Verify ports 8081, 19006, 19000 are not in use

---

## Best Practices

✅ **DO:**
- Use `Dockerfile.dev` for local development
- Use `Dockerfile` for production/Railway
- Keep both in sync with dependency changes
- Test production build locally before deploying

❌ **DON'T:**
- Mix development and production Dockerfiles
- Use `expo start` in production
- Use `serve` for local development (no hot reload)

---

This setup gives you the best of both worlds! 🎯

