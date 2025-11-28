# AsyncStorage - Local Data Persistence

## What is AsyncStorage?

AsyncStorage is React Native's **local storage system** for persisting data on the user's device. Think of it as a simple key-value database that survives app restarts.

## Why Do We Need It?

Without AsyncStorage:
- All data is lost when you close the app
- Orders and subscriptions would disappear
- Users would have to re-enter everything

With AsyncStorage:
- Data persists between app sessions
- Orders and subscriptions are saved
- Works offline (no internet needed)

## How It Works

### Basic Operations

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save data (key-value pairs)
await AsyncStorage.setItem('username', 'john');

// Get data
const username = await AsyncStorage.getItem('username');
// Returns: 'john' or null if not found

// Remove data
await AsyncStorage.removeItem('username');
```

### Storing Objects (JSON)

AsyncStorage only stores strings, so we use `JSON.stringify()` and `JSON.parse()`:

```typescript
// Save object
const user = { id: 1, name: 'John', email: 'john@example.com' };
await AsyncStorage.setItem('user', JSON.stringify(user));

// Get object
const stored = await AsyncStorage.getItem('user');
const user = stored ? JSON.parse(stored) : null;
```

## How We Use It in Egg9

### 1. Saving Weekly Stock
```typescript
async getWeeklyStock(): Promise<WeeklyStock> {
  const stored = await AsyncStorage.getItem('weeklyStock');
  if (stored) {
    return JSON.parse(stored);  // Return saved data
  }
  // First time - save mock data
  await AsyncStorage.setItem('weeklyStock', JSON.stringify(this.mockWeeklyStock));
  return this.mockWeeklyStock;
}
```

### 2. Saving Orders
```typescript
async createOrder(quantity: number, pricePerDozen: number) {
  // ... create order object ...
  
  // Get existing orders
  const orders = await this.getOrders();
  // Add new order
  orders.push(order);
  // Save back to storage
  await AsyncStorage.setItem('orders', JSON.stringify(orders));
  
  return order;
}
```

### 3. Saving Subscription
```typescript
async createSubscription(quantity: number) {
  // ... create subscription object ...
  
  // Save (overwrites previous)
  await AsyncStorage.setItem('subscription', JSON.stringify(subscription));
  
  return subscription;
}
```

## Why This Approach?

**Separation of Concerns:**
- Components don't know about AsyncStorage
- Components only call `apiService` methods
- When the Laravel API is ready, we **only change** `api.ts`
- Components stay unchanged!

**Example transition to real API:**
```typescript
// Current (AsyncStorage)
async getOrders(): Promise<Order[]> {
  const stored = await AsyncStorage.getItem('orders');
  return stored ? JSON.parse(stored) : [];
}

// Future (Laravel API)
async getOrders(): Promise<Order[]> {
  const response = await fetch(`${this.baseUrl}/orders`, {
    headers: this.getAuthHeaders()
  });
  return await response.json();
}
```

## Key Concepts

1. **Async/Await**: AsyncStorage operations are asynchronous (they take time)
2. **String Storage**: Only strings are stored, use JSON for objects
3. **Keys**: Like variable names, but for storage (`'orders'`, `'subscription'`)
4. **Persistence**: Data survives app restarts, device reboots
5. **Per-App**: Each app has its own isolated storage

## Data Flow in Our App

```
User clicks "Buy Now"
    ↓
Component calls apiService.createOrder()
    ↓
API Service:
  1. Creates order object
  2. Gets existing orders from AsyncStorage
  3. Adds new order to array
  4. Saves updated array to AsyncStorage
  5. Returns order to component
    ↓
Component updates UI with new data
```

## When AsyncStorage Is Used

- **App Load**: Read saved data (orders, subscription, stock)
- **User Action**: Save new data (place order, subscribe)
- **Update**: Modify existing data (edit subscription)
- **Delete**: Remove data (cancel subscription)

## Platform Support

- ✅ iOS - Uses native iOS storage
- ✅ Android - Uses native Android storage  
- ✅ Web - Uses browser LocalStorage
- ✅ Data format is the same on all platforms

This allows our app to work offline and persist data until we connect to the Laravel API!

