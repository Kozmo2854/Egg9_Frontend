# Tutorial 4: Project Structure

## What Just Happened?

We created an Expo project with the **Expo Router tabs template**. Let's explore what was generated!

---

## Project Directory Overview

```
Egg9/
├── app/                    # Your app screens (Expo Router)
├── assets/                 # Images, fonts, and static files
├── components/             # Reusable UI components
├── constants/              # App-wide constants (colors, config)
├── tutorials/              # Your learning materials!
├── node_modules/           # Installed packages (don't touch!)
├── package.json            # Project configuration & dependencies
├── app.json                # Expo configuration
├── tsconfig.json           # TypeScript configuration
├── babel.config.js         # JavaScript compiler config
└── Claude.md               # Project guidelines
```

---

## Important Files Explained

### 📦 `package.json`
The **heart of your Node.js project**.

**What it contains:**
- Project name and version
- Dependencies (libraries your app needs)
- Scripts (commands you can run)

```json
{
  "name": "egg9",
  "scripts": {
    "start": "expo start",      // Start dev server
    "web": "expo start --web",   // Run on web
    "android": "expo start --android",
    "ios": "expo start --ios"
  },
  "dependencies": {
    "expo": "~51.0.28",          // Expo framework
    "react": "18.2.0",           // React library
    "expo-router": "~3.5.23"     // File-based routing
  }
}
```

**Think of it like `composer.json` in Laravel!**

---

### 🎨 `app.json`
Expo-specific configuration.

**Contains:**
- App name and slug
- Icon and splash screen
- Platform-specific settings
- Version and build numbers

```json
{
  "expo": {
    "name": "Egg9",
    "slug": "egg9",
    "icon": "./assets/images/icon.png",
    "platforms": ["ios", "android", "web"]
  }
}
```

---

### 🗂️ `app/` Directory
**This is where your app screens live!**

Expo Router uses **file-based routing** (like Laravel routes, but based on file structure):

```
app/
├── _layout.tsx           # Root layout (wraps everything)
├── (tabs)/               # Tab navigation group
│   ├── _layout.tsx       # Tabs layout
│   ├── index.tsx         # Home screen → /
│   └── two.tsx           # Second tab → /two
├── modal.tsx             # Modal screen
└── +not-found.tsx        # 404 screen
```

**File-based routing:**
- `index.tsx` → `/` (home screen)
- `about.tsx` → `/about`
- `products/[id].tsx` → `/products/123` (dynamic route)

**Just like Laravel routes, but automatic!**

---

### 🧩 `components/` Directory
Reusable UI pieces.

**Examples:**
- `Button.tsx` - Custom button component
- `Header.tsx` - App header
- `ProductCard.tsx` - Product display card

**Think of them like Blade components in Laravel!**

```tsx
// components/Button.tsx
export function Button({ title, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <Text>{title}</Text>
    </Pressable>
  );
}

// Use it anywhere:
<Button title="Buy Eggs" onPress={handleBuy} />
```

---

### 🎨 `assets/` Directory
Static files (images, fonts, sounds).

```
assets/
├── images/
│   ├── icon.png         # App icon
│   ├── splash.png       # Splash screen
│   └── logo.png         # Your custom images
└── fonts/
    └── SpaceMono-Regular.ttf
```

---

### 📦 `node_modules/`
**Where npm installs all packages.**

- ⚠️ **NEVER edit files here manually!**
- ⚠️ **Don't commit to git!** (already in .gitignore)
- 🔄 Can be regenerated with `npm install`

**Like `vendor/` in Laravel!**

---

## TypeScript Notice

You might have noticed `.tsx` and `.ts` file extensions instead of `.js`.

**What is TypeScript?**
- JavaScript with **type checking**
- Catches errors before runtime
- Better autocomplete in editors
- Optional (can write regular JavaScript in .tsx files)

**Don't worry!** We'll create a tutorial for this in the next step.

For now, just know:
- `.tsx` = TypeScript + JSX (for components)
- `.ts` = TypeScript (for regular code)
- `.js` = Regular JavaScript

---

## Configuration Files

### `babel.config.js`
Configures how JavaScript is compiled.
- **You rarely need to touch this!**

### `tsconfig.json`
TypeScript configuration.
- **Usually no changes needed!**

---

## What's Installed?

Key packages from `package.json`:

| Package | Purpose |
|---------|---------|
| `expo` | Expo framework core |
| `expo-router` | File-based navigation |
| `react` | React library |
| `react-native` | React Native core |
| `react-native-web` | Web platform support |
| `@expo/vector-icons` | Icon library |

---

## Next Steps

Now that you understand the structure, let's:
1. Learn about TypeScript basics
2. Understand JSX/TSX syntax
3. Run the app for the first time!

---

## Quick Reference

**Start development server:**
```bash
npm start
```

**Install new package:**
```bash
npm install package-name
```

**Project structure in one image:**
```
Egg9 = Your Laravel project
app/ = routes/ + views/
components/ = Blade components
assets/ = public/
package.json = composer.json
node_modules/ = vendor/
```

Ready to continue? 🚀

