# Claude AI Context - Egg9 Frontend

This file contains important context and rules for AI assistants working on this project.

---

## Git + EAS Update Workflow

**⚠️ IMPORTANT: After pushing code, also push EAS updates!**

### Pushing to Test Branch (QA/Staging)
```bash
git add -A && git commit -m "Description" && git push
eas update --channel preview --message "Description"
```

### Pushing to Production
```bash
git checkout main
git merge test
git push
eas update --channel production --message "Description"
```

---

## EAS Update vs EAS Build

**⚠️ Always notify the user when a new APK build is required!**

### Use `eas update` (OTA - automatic for users):
- New screens/tabs
- UI changes, bug fixes
- Text/translation changes
- Style updates
- API call changes
- New images/icons (bundled)

**Command:** `eas update --channel <channel> --message "Description"`

### Use `eas build` (requires new APK download):
- Installing npm packages with native code (camera, maps, etc.)
- Adding new permissions in `app.json`
- Upgrading Expo SDK version
- Changing app icon or splash screen
- Changing app name or bundle ID

**Command:** `eas build --profile preview --platform android`

**Always tell the user:** 
- "This change requires a new APK build" 
- OR "This can be pushed via EAS Update (users get it automatically)"

---

## Channels

| Branch | EAS Channel | Backend |
|--------|-------------|---------|
| `test` | `preview` | egg9backend-staging.up.railway.app |
| `main` | `production` | egg9backend-production.up.railway.app |

---

## Project Structure

- **Expo Router** - File-based navigation in `app/` directory
- **React Native Paper** - UI components
- **i18next** - Translations in `i18n/locales/`
- **API Service** - `services/api.ts`

## Dashboard States

The home screen (Dashboard) has three main states:

| State | Condition | Display |
|-------|-----------|---------|
| **Outstanding** | User has unpaid orders from previous weeks | Takeover - only shows outstanding orders, blocks other actions |
| **Empty** | No orders and no subscription | CTA with Subscribe/Order buttons |
| **Active** | Has current week orders | 4 compact cards: Delivery, Payment, Order, Subscription |

### Sub-states for Active Orders:
- **Pending** - Delivery not scheduled yet
- **Scheduled** - Delivery date/time set
- **Delivered** - Orders delivered, needs pickup confirmation
- **Complete** - All picked up, "See you next week"

### Icon Consistency:
| Element | Icon |
|---------|------|
| Orders (One-time) | 🛒 / `shopping-basket` |
| Subscription | 🔄 / `refresh` |
| Delivery | 🚚 |
| Payment | 💳 |

## Environment Variables

- `EXPO_PUBLIC_API_URL` - Backend API URL
- `EXPO_PUBLIC_APP_ENV` - `development`, `staging`, or `production` (controls dev features)

## Branches

- `main` - Production
- `test` - Staging/QA testing

