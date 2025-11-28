# Tutorial 3: What is Expo?

## Understanding Expo

**Expo** is a framework and platform built on top of React Native that makes development easier and faster.

### Think of it as:
- **React Native** = Car engine
- **Expo** = Complete car with all features and tools ready to go!

---

## Why Use Expo?

### Without Expo (Bare React Native):
- ❌ Need to install Xcode (iOS) and Android Studio
- ❌ Complex setup and configuration
- ❌ Manual native code management
- ❌ Harder to add features like camera, notifications, etc.

### With Expo:
- ✅ Start coding in minutes
- ✅ No need for Xcode/Android Studio to get started
- ✅ Built-in APIs for camera, location, notifications, etc.
- ✅ Easy testing on real devices
- ✅ Simple deployment process
- ✅ **Supports Web out of the box!** 🌐

---

## Key Expo Features

### 1. **Expo Go App**
- Install on your phone from App Store/Play Store
- Scan QR code → instantly see your app
- No need to compile or install anything!

### 2. **Expo SDK**
Pre-built modules for common features:
- Camera
- Location/GPS
- Push notifications
- File system
- Authentication
- And 100+ more!

### 3. **Expo Router**
File-based navigation system (similar to Next.js for web):

```
app/
  index.js          → Home screen (/)
  about.js          → About screen (/about)
  products/
    [id].js         → Product detail screen (/products/123)
```

### 4. **EAS (Expo Application Services)**
- Build your app in the cloud
- Deploy updates instantly (without app store approval!)
- Submit to App Store and Google Play

---

## Expo Workflow Types

### 1. **Managed Workflow** (What we're using!)
- Expo handles all the native code
- Focus on JavaScript only
- Perfect for most apps (including Egg9!)

### 2. **Bare Workflow**
- Full React Native control
- Can use any native library
- Use when you need custom native features

**Good news:** You can start with Managed and "eject" to Bare later if needed!

---

## How Expo Works

```
Write JavaScript Code
        ↓
Expo SDK & Router
        ↓
React Native
        ↓
Native iOS/Android/Web
```

### Development Flow:

1. **Write code** in JavaScript
2. **Run dev server** → `npx expo start`
3. **See changes instantly** (Fast Refresh)
4. **Test on device** via Expo Go or web browser
5. **Build & deploy** when ready

---

## Expo vs React Native Comparison

| Feature | Bare React Native | Expo Managed |
|---------|------------------|--------------|
| Setup time | Hours | Minutes |
| Native tools needed | Yes (Xcode/Android Studio) | No |
| Web support | Manual setup | Built-in |
| Native modules | All available | Most available |
| Updates | App store only | Over-the-air |
| Complexity | High | Low |
| Best for | Large teams, custom needs | Startups, MVPs, most apps |

---

## Expo Commands (Preview)

```bash
# Create new Expo project
npx create-expo-app MyApp

# Start development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Run on web browser
npx expo start --web

# Build for production
eas build
```

---

## For Egg9 Project:

Perfect fit because:
- ✅ **Beginner-friendly**: Simple setup and learning curve
- ✅ **Multi-platform**: iOS, Android, Web from one codebase
- ✅ **Fast development**: Hot reload, easy testing
- ✅ **Backend separation**: Works great with Laravel API
- ✅ **Future-proof**: Can add more features easily

---

## What's Next?

In the next steps, we'll:
1. Install Expo CLI
2. Create our Egg9 project
3. Understand the project structure
4. Run our first app!

Get ready to build! 🚀

