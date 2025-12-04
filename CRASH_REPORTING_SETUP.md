# Crash Reporting & Analytics Setup

## Recommended: Sentry for Expo

Sentry is the most popular crash reporting solution for React Native/Expo apps.

### Setup Steps

1. **Create Sentry Account**
   - Sign up at https://sentry.io
   - Create a new project (select React Native)
   - Copy your DSN

2. **Install Dependencies**
```bash
npx expo install @sentry/react-native
```

3. **Configure Sentry**

Add to `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "@sentry/react-native/expo",
        {
          "organization": "YOUR_ORG",
          "project": "egg9"
        }
      ]
    ]
  }
}
```

4. **Initialize in App**

Update `app/_layout.tsx`:
```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_DSN_HERE',
  enableInExpoDevelopment: false,
  debug: __DEV__,
});
```

5. **Environment Variables**

Add to EAS secrets:
```bash
eas secret:create --name SENTRY_DSN --value "your-dsn"
```

Add to `eas.json`:
```json
{
  "build": {
    "production": {
      "env": {
        "SENTRY_DSN": "your-dsn"
      }
    }
  }
}
```

### Alternative: Expo Updates + Error Boundary

For simpler crash tracking without external services:

1. Wrap app in Error Boundary
2. Log errors to your backend
3. Use Expo Updates for remote debugging

## Backend Logging (Laravel)

Laravel has built-in error logging. For production:

1. **Configure Log Channel** in `.env`:
```
LOG_CHANNEL=stack
LOG_LEVEL=error
```

2. **Use Railway Logging**
   - Railway auto-captures stdout/stderr
   - View in Railway dashboard under "Logs"

3. **Optional: External Service**
   - Papertrail, Loggly, or Sentry for Laravel

