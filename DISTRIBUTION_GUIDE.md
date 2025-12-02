# Egg9 App Distribution Guide

Guide for building and distributing the Egg9 mobile app to users without app stores.

## Prerequisites

### One-Time Setup

1. **Install EAS CLI:**
```bash
npm install -g eas-cli
```

2. **Login to Expo account:**
```bash
eas login
```

If you don't have an Expo account, create one at https://expo.dev (free)

3. **Configure project:**
```bash
cd Egg9_Frontend
eas build:configure
```

This was already done - it created `eas.json`.

---

## Building APK for Distribution

### For Internal Testing (Preview Build)

```bash
cd Egg9_Frontend

# Build Android APK
eas build --platform android --profile preview
```

**What happens:**
1. EAS uploads your code to their servers
2. Builds the APK in the cloud (takes 5-15 minutes)
3. Provides download link when complete

**Download the APK:**
- Copy the link from terminal output
- Or visit: https://expo.dev/accounts/[your-account]/projects/egg9/builds

### For Production Release

```bash
eas build --platform android --profile production
```

Use this for the final version you'll distribute to all users.

---

## Distributing to Users

### Option 1: Direct Link (Recommended)

1. **Build the app** (as shown above)
2. **Download APK** from EAS dashboard
3. **Host APK** on your server:
   ```bash
   # Example: Upload to your server
   scp egg9-v1.0.0.apk user@yourserver.com:/var/www/downloads/
   ```
4. **Share link** with users: `https://yourserver.com/downloads/egg9-v1.0.0.apk`

### Option 2: Cloud Storage

Upload APK to:
- Google Drive (generate shareable link)
- Dropbox
- OneDrive
- Any cloud storage

### Option 3: Email

- Attach APK file to email
- Send to users directly
- **Warning**: Gmail might block APK files, use cloud link instead

---

## User Installation Instructions

Share these instructions with your users:

### Android Installation

1. **Enable installation from unknown sources:**
   - Go to **Settings** → **Security**
   - Enable **"Install unknown apps"** for your browser/file manager
   - Or: **Settings** → **Apps** → **Special access** → **Install unknown apps**

2. **Download the APK:**
   - Click the link you provided
   - Or download from email attachment

3. **Install:**
   - Tap the downloaded APK file
   - Tap **"Install"**
   - Tap **"Open"** when installation completes

4. **Login:**
   - Use provided credentials
   - Or register a new account

### iOS Installation

iOS requires either:
- **TestFlight** (needs Apple Developer account - $99/year)
- **Ad Hoc distribution** (needs device UDIDs registered)

For now, iOS users can use the **web version**: https://your-frontend.up.railway.app

---

## Updating the App

### When you make changes:

1. **Increment version numbers** in `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",  // Increment this (user-visible)
    "android": {
      "versionCode": 2   // Increment this (must be higher than previous)
    }
  }
}
```

2. **Build new APK:**
```bash
eas build --platform android --profile production
```

3. **Distribute new APK:**
   - Upload to same location
   - Update the link (or rename file to include version)
   - Notify users to download and install

**Users install updates the same way:**
- Download new APK
- Install (overwrites old version)
- Data is preserved (orders, login, etc.)

---

## Build Options

### Build for specific channel:

```bash
# Development build (with dev tools)
eas build --platform android --profile development

# Preview build (for testing)
eas build --platform android --profile preview

# Production build (final version)
eas build --platform android --profile production
```

### Build both platforms:

```bash
eas build --platform all --profile preview
```

### Check build status:

```bash
eas build:list
```

Or visit: https://expo.dev

---

## Environment Variables for Builds

EAS reads from your local `.env` file during build, but for production you should set them in EAS:

```bash
# Set production API URL
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://your-backend.up.railway.app/api

# Set environment
eas secret:create --scope project --name EXPO_PUBLIC_APP_ENV --value production
```

**Note:** Since we're using build-time environment variables, they're baked into the APK. If you change the backend URL, you'll need to rebuild and redistribute.

---

## Troubleshooting

### Build fails with "Missing Android credentials"

EAS will prompt you to generate credentials automatically. Select **yes** when asked.

### APK won't install on user's phone

- Check they've enabled "Install from unknown sources"
- Verify APK file isn't corrupted (try downloading again)
- Check Android version (must be 5.0 or higher)

### Users can't connect to backend

- Verify `EXPO_PUBLIC_API_URL` is set correctly
- Test backend URL manually: `curl https://your-backend/api/weekly-stock`
- Check CORS is configured on backend

### Old version still running after update

Users need to:
1. Uninstall old version
2. Install new version
3. Or: Clear app data in Settings → Apps → Egg9 → Storage → Clear data

---

## Cost

**EAS Build:** Free tier includes:
- 30 builds per month
- Unlimited projects
- All build types (APK, AAB, IPA)

If you need more builds, paid plans start at $29/month.

---

## Best Practices

1. **Version numbering:**
   - Use semantic versioning: `1.0.0` → `1.0.1` (bug fixes) → `1.1.0` (new features)
   - Always increment `versionCode` with each build

2. **Testing:**
   - Build with `preview` profile first
   - Test on real device
   - Then build with `production` profile for final distribution

3. **Distribution:**
   - Keep a changelog of what's new in each version
   - Notify users when updates are available
   - Host APKs on reliable server with good bandwidth

4. **Naming convention:**
   - Name APK files clearly: `egg9-v1.0.0.apk`
   - Makes it easy to track versions

---

## Next Steps

1. **Build your first APK:**
   ```bash
   eas build --platform android --profile preview
   ```

2. **Test it** on your own device first

3. **Distribute** to initial test users

4. **Collect feedback**

5. **Make improvements**

6. **Build production version** and distribute to all users

---

**Need help?** Check EAS documentation: https://docs.expo.dev/build/introduction/

