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

**Customer**: One-time orders, subscriptions, payment tracking (QR code + bank transfer), order lifecycle tracking

**Admin**: Stock management, delivery scheduling, order management, payment confirmation, user management, payment settings

**Test Credentials**: See `services/api.ts` quick login buttons or backend seeders

## Technology Stack

- React Native + Expo
- TypeScript
- Expo Router (file-based navigation)
- React Native Paper (Material Design 3)
- AsyncStorage for token persistence

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
├── modal.tsx                 # Login screen
└── register.tsx              # Registration

services/api.ts               # API service layer
types/models.ts               # TypeScript interfaces
utils/orderHelpers.ts         # Order/payment helpers
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

## Docker Setup

See [DOCKER_SETUP.md](DOCKER_SETUP.md) for Docker configuration (local dev vs production).

## Environment Variables

### Local (.env)
```bash
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_APP_ENV=development
```

### Production (Railway)
Set in Railway dashboard:
- `EXPO_PUBLIC_API_URL`: Backend API URL
- `EXPO_PUBLIC_APP_ENV`: `production`

**Important**: Variables are baked into build at compile time (not runtime).

## Deployment

### Railway

Push to repository - Railway auto-deploys using `Dockerfile`.

Railway builds static files with `expo export` and serves with `serve` package.

See [DOCKER_SETUP.md](DOCKER_SETUP.md) for Dockerfile configuration details.

## Business Logic

See `../.ai-context/BUSINESS_LOGIC.md` for order lifecycle, payment flow, and subscription rules.

## Documentation

- **Main README**: This file
- **Docker Setup**: [DOCKER_SETUP.md](DOCKER_SETUP.md)
- **Business Logic**: `../.ai-context/BUSINESS_LOGIC.md`
- **AI Agent Guide**: `.ai-context/AGENT_INSTRUCTIONS.md`
- **Tutorials**: `.ai-context/tutorials/` (React Native learning resources)

## License

Proprietary - Egg9 Platform
