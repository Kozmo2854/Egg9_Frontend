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

# Edit .env and set your IP
# EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api
```

### 3. Start Backend
```bash
cd Egg9_Backend

# Start Laravel (IMPORTANT: use --host=0.0.0.0 so phone can connect)
php artisan serve --host=0.0.0.0

# Backend will be at: http://0.0.0.0:8000
```

### 4. Start Frontend
```bash
cd Egg9_Frontend

# Start Expo dev server
npx expo start --dev-client

# Scan QR code with your phone
```

## Troubleshooting

### Phone can't connect to backend?
1. Make sure phone and computer are on **same WiFi network**
2. Check computer's IP hasn't changed
3. Verify Laravel is running with `--host=0.0.0.0`
4. Check firewall isn't blocking port 8000

### Database setup
```bash
cd Egg9_Backend
php artisan migrate
php artisan db:seed  # Optional: seed test data
```

## Production Builds

For production builds, `eas.json` automatically sets the Railway backend URL:
```bash
eas build --profile production --platform android
```

