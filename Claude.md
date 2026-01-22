# Claude AI Context - Egg9 Frontend

This file contains important context and rules for AI assistants working on this project.

---

## Git + EAS Update Workflow

**⚠️ IMPORTANT: After pushing code, also push EAS updates with the correct environment!**

### Pushing to Test Branch (QA/Staging)
```bash
git add -A && git commit -m "Description" && git push
eas update --channel preview --environment preview --message "Description"
```

### Pushing to Production
```bash
git checkout main
git merge test
git push
eas update --channel production --environment production --message "Description"
```

**Note:** The `--environment` flag uses environment variables from EAS Dashboard, NOT your local `.env` file.

---

## Environment Variables

### Local Development (`.env` file - gitignored)
```
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_APP_ENV=development
```

### EAS Dashboard Environments
Environment variables are stored in EAS Dashboard for staging and production:
- **preview**: `EXPO_PUBLIC_API_URL=https://egg9backend-staging.up.railway.app/api`, `EXPO_PUBLIC_APP_ENV=staging`
- **production**: `EXPO_PUBLIC_API_URL=https://egg9backend-production.up.railway.app/api`, `EXPO_PUBLIC_APP_ENV=production`

**Never manually edit `.env` for EAS updates!** Always use `--environment` flag.

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

**Command:** `eas update --channel <channel> --environment <env> --message "Description"`

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

## Channels & Environments

| Branch | EAS Channel | EAS Environment | Backend |
|--------|-------------|-----------------|---------|
| `test` | `preview` | `preview` | egg9backend-staging.up.railway.app |
| `main` | `production` | `production` | egg9backend-production.up.railway.app |

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

---

## Subscription & Order Management

### Subscriptions
- **Cannot be edited** - Users can only create new subscriptions or cancel existing ones
- **Cancellation preserves paid orders** - When cancelled, only unpaid orders are deleted. Paid orders (or orders with payment submitted) remain visible to admin for delivery.

### Orders
- **Can be edited/cancelled if unpaid** - Once payment is submitted or confirmed, orders cannot be modified.
- **Order Card displays:** Quantity, Date of payment (or "Not paid yet"), Total
- **Action buttons (Modify/Cancel):** Only visible if order is NOT paid

---

## Production Configuration (Railway)

### Required Environment Variables on Railway Backend:

```
# Logging - outputs to both file AND Railway logs
LOG_CHANNEL=stack
LOG_STACK=single,stderr
LOG_LEVEL=info

# Queue - sync for immediate processing (no worker needed)
QUEUE_CONNECTION=sync

# Email - disabled until SMTP issue resolved (Railway blocks port 587)
MAIL_MAILER=array
```

### Notification Architecture
- **Push-first, email-second** - Push notifications are sent to ALL users first, then emails are attempted
- **Independent failures** - If email fails, push has already succeeded
- **Timeouts configured** - Both SMTP and Expo Push API have 10-second timeouts to prevent hangs

### Known Limitations
- **Email not working on Railway** - Railway blocks outbound SMTP (port 587). Options:
  1. Use HTTP-based email service (SendGrid, Mailgun, Postmark)
  2. Keep emails disabled with `MAIL_MAILER=array`

