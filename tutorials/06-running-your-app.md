# Tutorial 6: Running Your App

## Starting the Development Server

When you run `npm start`, here's what happens:

### 1. **Expo Dev Server Starts**
```bash
Starting project at /home/j.zejnula/Projects/Egg9
```
- Starts a local development server
- Usually runs on `http://localhost:8081`

### 2. **Metro Bundler Starts**
```bash
Starting Metro Bundler
```
**What is Metro?**
- JavaScript bundler (like Webpack)
- Combines all your files into one bundle
- Enables "Fast Refresh" (instant updates)

### 3. **Bundles Your Code**
```bash
λ Bundled 6837ms node_modules/expo-router/node/render.js (836 modules)
Web Bundled 8202ms node_modules/expo-router/entry.js (816 modules)
```
- Processes all JavaScript files
- Compiles TypeScript to JavaScript
- Optimizes for the target platform

---

## Ways to Run Your App

### Option 1: Web Browser (Easiest!) 🌐

**Command:**
```bash
npm run web
```

**Or open in browser:**
```
http://localhost:8081
```

**Advantages:**
- ✅ Instant - just open browser
- ✅ No phone needed
- ✅ Great for development
- ✅ Same code as mobile!

**When to use:** Testing UI, layout, most features

---

### Option 2: Expo Go App (Mobile) 📱

**Setup:**
1. Install "Expo Go" from App Store (iOS) or Play Store (Android)
2. Run `npm start`
3. Scan the QR code with your phone

**Advantages:**
- ✅ Test on real device
- ✅ No simulator needed
- ✅ Easy to test with others
- ✅ Test device features (camera, GPS, etc.)

**When to use:** Testing on real hardware, showing to others

---

### Option 3: iOS Simulator (Mac Only) 🍎

**Command:**
```bash
npm run ios
```

**Requirements:**
- Mac computer
- Xcode installed

**When to use:** Testing iOS-specific features

---

### Option 4: Android Emulator 🤖

**Command:**
```bash
npm run android
```

**Requirements:**
- Android Studio installed
- Android emulator configured

**When to use:** Testing Android-specific features

---

## Development Commands

```bash
# Start dev server (shows menu)
npm start

# Start and open web browser
npm run web

# Start for iOS (Mac only)
npm run ios

# Start for Android
npm run android
```

---

## What You'll See

### In Terminal:
```
› Metro waiting on http://localhost:8081

› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
› Press o │ open project code in your editor

› Press ? │ show all commands
```

### In Browser:
You'll see your app running! It should show:
- Two tabs at the bottom
- "Welcome!" message
- Some demo content

---

## Fast Refresh / Hot Reload

**The Magic Feature!** ✨

When you save a file:
1. Metro detects the change
2. Rebundles just what changed
3. Sends update to your app
4. App refreshes instantly (< 1 second!)

**No need to manually reload!**

**Compare to PHP:**
- PHP: Save → Refresh browser → See change
- React Native: Save → Auto-refresh → See change

---

## Development Workflow

```
┌─────────────────────────────────┐
│  1. Start dev server            │
│     npm start                   │
└─────────────┬───────────────────┘
              │
              ↓
┌─────────────────────────────────┐
│  2. Open app (web/mobile)       │
│     Press 'w' or open browser   │
└─────────────┬───────────────────┘
              │
              ↓
┌─────────────────────────────────┐
│  3. Edit code in editor         │
│     VS Code / Cursor            │
└─────────────┬───────────────────┘
              │
              ↓
┌─────────────────────────────────┐
│  4. Save file (Ctrl/Cmd + S)    │
└─────────────┬───────────────────┘
              │
              ↓
┌─────────────────────────────────┐
│  5. See instant update!         │
│     (Fast Refresh magic!)       │
└─────────────────────────────────┘
```

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or start on different port
npx expo start --port 8082
```

### App Won't Load
1. Check terminal for errors
2. Press `r` to reload
3. Restart dev server (Ctrl+C, then npm start)

### Changes Not Showing
1. Save the file (Ctrl/Cmd + S)
2. Wait 1-2 seconds
3. Check terminal for errors
4. Press `r` to manually reload

### "Module not found" Error
```bash
# Install dependencies
npm install

# Clear cache
npx expo start --clear
```

---

## For Egg9 Project

We'll primarily use:
- **Web** (fastest for development)
- **Expo Go on phone** (test on real device)

Both run the same code! 🎉

---

## What's Next?

Now that you can run the app, let's:
1. Explore the existing code
2. Make our first change
3. See Fast Refresh in action!

Ready to code? 🚀

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start server | `npm start` |
| Open web | `npm run web` or press `w` |
| Open iOS | `npm run ios` or press `i` |
| Open Android | `npm run android` or press `a` |
| Reload | Press `r` |
| Clear cache | `npx expo start --clear` |
| Stop server | Press `Ctrl+C` |

