# Quick Build Reference

## First Time Setup (Do Once)

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. You're ready to build!
```

---

## Build Commands

### Preview Build (For Testing)
```bash
cd Egg9_Frontend
eas build --platform android --profile preview
```
⏱️ Takes 5-15 minutes

### Production Build (For Distribution)
```bash
cd Egg9_Frontend
eas build --platform android --profile production
```
⏱️ Takes 5-15 minutes

---

## After Build Completes

1. **Download APK** from the link provided in terminal
2. **Test** on your device first
3. **Share** the APK file with users

---

## Update Version (Before Each New Build)

Edit `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",      // Increment (shown to users)
    "android": {
      "versionCode": 2       // Increment (must be higher)
    }
  }
}
```

---

## Where to Find Your Builds

- Terminal output (link after build)
- https://expo.dev (login and go to your project)
- EAS dashboard shows all builds and download links

---

## User Installation

Share these steps:
1. Enable "Install from unknown sources" in Settings
2. Download the APK file
3. Tap to install
4. Open and login

---

See `DISTRIBUTION_GUIDE.md` for complete documentation.

