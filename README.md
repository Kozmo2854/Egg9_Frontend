# Egg9 Frontend

React Native/Expo application for Egg9 weekly egg delivery platform. Supports iOS, Android, and Web.

## Quick Start

```bash
npm install
cp .env.example .env

# Edit .env with your backend URL
# EXPO_PUBLIC_API_URL=http://localhost:8000/api

npm run web
```

App opens at: `http://localhost:8081`

## Key Features

**Customer:** One-time orders, subscriptions, payment tracking (QR code + bank transfer), order lifecycle tracking, push/email notifications

**Admin:** Stock management, delivery scheduling, order management, payment confirmation, user management, payment settings

**Test Credentials:** See `services/api.ts` quick login buttons or backend seeders

## Technology Stack

- React Native + Expo
- TypeScript
- Expo Router (file-based navigation)
- React Native Paper (Material Design 3)
- i18next (internationalization - EN/SR)
- AsyncStorage for token persistence
- Expo Notifications

## Project Structure

```
app/
├── (tabs)/                    # Tab navigation
│   ├── index.tsx             # Customer home
│   ├── two.tsx               # One-time orders
│   ├── subscription.tsx      # Subscriptions
│   ├── admin.tsx             # Admin panel
│   ├── users.tsx             # User management
│   └── payment-settings.tsx  # Payment config
├── settings.tsx              # User settings
├── order-history.tsx         # Order history
├── modal.tsx                 # Login screen
└── register.tsx              # Registration

components/
└── DrawerMenu.tsx            # Slide-out menu

services/api.ts               # API service layer
types/models.ts               # TypeScript interfaces
utils/orderHelpers.ts         # Order/payment helpers
i18n/locales/                 # Translation files (en.json, sr.json)
```

## Running the App

```bash
# Web (recommended for development)
npm run web

# iOS
npm run ios

# Android
npm run android

# Expo Go (scan QR code)
npm start
```

## Environment Variables

### Local (.env)
```bash
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_APP_ENV=development
```

For phone testing with local backend:
```bash
# Get your computer's IP
hostname -I | awk '{print $1}'
# Example: 192.168.1.100

EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api
```

### Production (eas.json / Railway)
```bash
EXPO_PUBLIC_API_URL=https://your-backend.up.railway.app/api
EXPO_PUBLIC_APP_ENV=production
```

**Important:** Variables are baked into build at compile time (not runtime).

## Local Development with Phone

### Prerequisites
- Phone and computer on same WiFi network
- Docker backend running

### Steps
```bash
# 1. Start backend
cd Egg9  # Root folder
docker compose up -d backend mysql

# 2. Get your IP and update .env
hostname -I | awk '{print $1}'
# Edit .env: EXPO_PUBLIC_API_URL=http://YOUR_IP:8000/api

# 3. Start Expo
cd Egg9_Frontend
npx expo start --dev-client

# 4. Scan QR code with phone
```

## Building for Distribution

### Prerequisites
```bash
npm install -g eas-cli
eas login
```

### Build Commands
```bash
# Preview build (for testing)
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production
```

### Update Version (before each build)
Edit `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}
```

### Distribution
1. Download APK from EAS dashboard or terminal link
2. Host on server, cloud storage, or share directly
3. Users enable "Install from unknown sources" and install

## Docker Setup

### Dockerfile (Production - Railway)
- Builds static files with `expo export`
- Serves with `serve` package
- Used automatically by Railway

### Dockerfile.dev (Local Development)
- Starts Expo development server
- Hot reload enabled
- Used by `docker compose up frontend`

```bash
# Local development
docker compose up frontend

# Test production build locally
docker build -f Dockerfile -t egg9-frontend .
docker run -p 8081:8081 -e PORT=8081 egg9-frontend
```

## Crash Reporting (Optional)

For production, consider adding Sentry:

1. Sign up at https://sentry.io
2. Install: `npx expo install @sentry/react-native`
3. Configure in `app.json` and `app/_layout.tsx`

See Sentry docs for Expo: https://docs.sentry.io/platforms/react-native/guides/expo/

## Deployment

### Railway
Push to repository - Railway auto-deploys using `Dockerfile`.

Railway builds static files and serves with HTTP server.

### EAS Build
For mobile apps, use EAS Build. Environment variables are set in `eas.json` per profile.

## Business Logic

See `../.ai-context/BUSINESS_LOGIC.md` for order lifecycle, payment flow, and subscription rules.

## Documentation

- **Main README**: This file
- **Business Logic**: `../.ai-context/BUSINESS_LOGIC.md`
- **AI Agent Guide**: `.ai-context/AGENT_INSTRUCTIONS.md`
- **Tutorials**: `.ai-context/tutorials/` (React Native learning resources)

---

**Last Updated**: December 10, 2024
