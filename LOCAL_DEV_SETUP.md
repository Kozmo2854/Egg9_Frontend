# Local Development Setup

## Quick Start

### 1. Get Your Computer's IP
```bash
hostname -I | awk '{print $1}'
# Example output: 192.168.1.100
```

### 2. Configure Frontend
```bash
cd Egg9_Frontend

# Create .env from example
cp .env.example .env

# Edit .env and set your IP (port 8000 from Docker)
# EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api
```

### 3. Start Backend (Docker Compose)
```bash
cd Egg9  # Root folder

# Start backend + database
docker compose up -d backend mysql

# Verify it's running
docker compose ps
# Backend available at: http://localhost:8000
```

### 4. Start Frontend (on your machine, not Docker)
```bash
cd Egg9_Frontend

# Start Expo dev server
npx expo start --dev-client

# Scan QR code with your phone
```

## Summary

| Service | How to Run | URL |
|---------|------------|-----|
| Backend | `docker compose up -d backend mysql` | `http://YOUR_IP:8000/api` |
| Database | Started with backend | `localhost:3307` |
| Frontend | `npx expo start --dev-client` | Expo QR code |

## Troubleshooting

### Phone can't connect to backend?
1. Make sure phone and computer are on **same WiFi network**
2. Check computer's IP hasn't changed: `hostname -I`
3. Verify Docker is running: `docker compose ps`
4. Check backend logs: `docker compose logs backend`

### Database commands
```bash
# Run migrations
docker compose exec backend php artisan migrate

# Seed test data
docker compose exec backend php artisan db:seed

# Fresh start (reset DB)
docker compose exec backend php artisan migrate:fresh --seed
```

### Restart services
```bash
# Restart everything
docker compose restart

# Rebuild after code changes
docker compose up -d --build backend
```

## Production Builds

For production builds, `eas.json` automatically sets the Railway backend URL:
```bash
eas build --profile production --platform android
```
