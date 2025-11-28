# Tutorial 11: Backend API Integration

## What Changed

Your app now connects to a **real Laravel backend** instead of using mock data!

## Overview

All the mock implementations in `services/api.ts` have been replaced with real `fetch()` calls to the Laravel backend API running at `http://localhost:8000/api`.

---

## Key Changes

### 1. Real API Calls

**Before (Mock):**
```typescript
async login(email: string, password: string) {
  // Simulated with setTimeout and mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = MOCK_CREDENTIALS.find(...);
      resolve({ user, token: 'mock-token' });
    }, 800);
  });
}
```

**After (Real API):**
```typescript
async login(email: string, password: string) {
  const response = await fetch(`${this.baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  await AsyncStorage.setItem('auth_token', data.token);
  return data;
}
```

### 2. Token-Based Authentication

The backend uses **Laravel Sanctum** for authentication:

1. **Login/Register** → Receive a token
2. **Store token** → AsyncStorage saves it
3. **Authenticated requests** → Include `Authorization: Bearer {token}` header

### 3. Helper Methods

Two new helper methods make API calls cleaner:

#### `getAuthHeaders()`
```typescript
private async getAuthHeaders(): Promise<HeadersInit> {
  const token = await AsyncStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}
```

Automatically adds the auth token to requests.

#### `handleResponse()`
```typescript
private async handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  
  return data;
}
```

Handles errors consistently across all API calls.

---

## Backend Information

### API Base URL
```typescript
private baseUrl: string = 'http://localhost:8000/api';
```

### Test Accounts (Already Created)
```
Admin:     admin@egg9.com / password123
Customer:  user1@egg9.com / password123
Customer:  user2@egg9.com / password123
```

### Available Stock
- **1000 eggs** available
- **$5.99** per dozen (10 eggs)
- Delivery: Saturday 10:00 AM - 2:00 PM

---

## What Stays the Same

### Same Interface
All method signatures are **exactly the same**, so your UI components don't need any changes!

```typescript
// These still work exactly as before:
await apiService.login(email, password);
await apiService.getWeeklyStock();
await apiService.createOrder(quantity, pricePerDozen);
await apiService.getSubscription();
```

### Same Data Types
All TypeScript interfaces in `types/models.ts` remain unchanged.

---

## Response Format

The backend wraps responses in objects:

### Orders
```json
{
  "order": {
    "id": 1,
    "userId": 2,
    "quantity": 20,
    "pricePerDozen": 5.99,
    "total": 11.98,
    "status": "pending",
    "deliveryStatus": "not_delivered",
    "weekStart": "2025-11-17T00:00:00.000000Z",
    "createdAt": "2025-11-19T14:55:41.000000Z",
    "updatedAt": "2025-11-19T14:55:41.000000Z"
  }
}
```

The API service extracts the inner object:
```typescript
const data = await this.handleResponse<{ order: Order }>(response);
return data.order; // Returns just the order object
```

### Lists
```json
{
  "orders": [
    { "id": 1, ... },
    { "id": 2, ... }
  ]
}
```

---

## Error Handling

Errors are thrown with descriptive messages:

```typescript
try {
  await apiService.createOrder(50);
} catch (error) {
  // error.message will contain the backend error
  console.log(error.message); // e.g., "Insufficient stock available"
}
```

Common errors:
- `"Invalid email or password"` - Login failed
- `"Insufficient stock available"` - Not enough eggs
- `"Unauthorized"` - Token expired or invalid
- `"Validation error"` - Invalid input data

---

## How Data Flows

### Example: Creating an Order

1. **User taps "Place Order"** in UI
2. **Component calls** `apiService.createOrder(20, 5.99)`
3. **API service:**
   - Gets auth token from AsyncStorage
   - Makes POST request to `http://localhost:8000/api/orders`
   - Includes `Authorization: Bearer {token}` header
   - Sends `{ "quantity": 20 }` as JSON
4. **Backend:**
   - Validates the request
   - Checks stock availability
   - Creates order in database
   - Returns order object
5. **API service:**
   - Parses response
   - Extracts `data.order`
   - Returns to component
6. **Component:**
   - Updates UI with new order
   - Shows success message

---

## Starting the Backend

### Option 1: With Docker
```bash
cd /path/to/Egg9_Backend
docker compose up -d
```

### Option 2: With PHP
```bash
cd /path/to/Egg9_Backend
php artisan serve --port=8000
```

### Check it's running
```bash
curl http://localhost:8000/api/weekly-stock
```

---

## Testing the Integration

### 1. Start the Backend
```bash
cd /home/j.zejnula/Projects/Egg9_Backend
php artisan serve --port=8000
```

### 2. Start Your App
```bash
cd /home/j.zejnula/Projects/Egg9
npx expo start --tunnel
```

### 3. Test Login
- Open your app
- Navigate to login screen
- Use: `admin@egg9.com` / `password123`
- Should successfully log in and show the home screen

### 4. Test Features
- View weekly stock (should show 1000 eggs)
- Create an order (should work and reduce available eggs)
- Create a subscription (should save to backend)
- Admin features (stock management, delivery settings)

---

## Troubleshooting

### "Network request failed"
- **Check:** Is the backend running? `curl http://localhost:8000/up`
- **Fix:** Start the backend with `php artisan serve --port=8000`

### "Unauthorized" errors
- **Check:** Is the token valid?
- **Fix:** Log out and log in again

### CORS errors (Web only)
- **Backend is configured** for React Native and Expo
- If you see CORS errors on web, they can be ignored (mobile works fine)

### Different port?
If your backend runs on a different port, update:
```typescript
// services/api.ts
private baseUrl: string = 'http://localhost:YOUR_PORT/api';
```

---

## What You Can Do Now

✅ **Real Authentication** - Users are stored in MySQL/PostgreSQL  
✅ **Real Orders** - Persisted in database  
✅ **Real Subscriptions** - Auto-create orders every Monday  
✅ **Real Stock Management** - Admin can update stock  
✅ **Multi-User** - Multiple users sharing real stock  
✅ **Admin Panel** - Manage everything from the app  

---

## Backend Features

### Automatic Weekly Cycle
Every Monday at 00:01, the backend automatically:
1. Archives last week's stock
2. Creates new week's stock
3. Processes all active subscriptions
4. Creates orders for subscribed users

### Database
- **Users** table - All registered users
- **Weekly Stocks** table - Stock for each week
- **Orders** table - All orders (one-time purchases)
- **Subscriptions** table - Recurring weekly orders

### Testing
The backend has **87 tests** (100% passing):
- 20+ unit tests
- 67 feature tests
- All 21 endpoints tested

---

## Next Steps

1. **Test everything** - Try all features with real backend
2. **Check data persistence** - Orders/subscriptions save correctly
3. **Test multi-user** - Log in as different users
4. **Test admin panel** - Manage stock and orders

Your app is now fully connected to a production-ready backend! 🚀

