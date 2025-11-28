# AI Agent Instructions - Egg9 Frontend

## Project Context

Egg9 is a React Native/Expo application for weekly egg delivery subscriptions. It connects to a Laravel backend API and supports web, iOS, and Android platforms.

## Critical Business Rules

1. **1 dozen = 10 eggs** (NOT 12!) - Serbian standard, never changes
2. All quantities are multiples of 10
3. Currency: Serbian Dinars (RSD), no decimals in display
4. Subscriptions: 2-4 weeks only
5. One order per user per week (updatable if pending and unpaid)
6. Orders can't be modified once paid

## Technology Stack

- **React Native + Expo**: Cross-platform framework
- **Expo Router**: File-based navigation with tabs/stacks
- **TypeScript**: Type safety throughout
- **React Native Paper**: Material Design UI library
- **AsyncStorage**: Token and user data persistence
- **No state management library**: Simple useState/useEffect patterns

## Architecture Patterns

### API Service Layer

All backend communication goes through `services/api.ts`:

```typescript
// Always use the centralized service
import { apiService } from '@/services/api';

// Never use fetch directly
const result = await apiService.someMethod();
```

**Service Methods:**
- Handle authentication (token injection)
- Format requests (camelCase → snake_case if needed)
- Format responses (snake_case → camelCase)
- Throw errors with user-friendly messages

### State Management Pattern

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [data, setData] = useState<Type | null>(null);

const loadData = async () => {
  setLoading(true);
  setError('');
  try {
    const result = await apiService.getData();
    setData(result);
  } catch (err: any) {
    setError(err.message || 'An error occurred');
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  loadData();
}, []);
```

### Screen Refresh Pattern

Use `useFocusEffect` for data that should refresh when user navigates back:

```typescript
import { useFocusEffect } from '@react-navigation/native';

useFocusEffect(
  React.useCallback(() => {
    loadData();
  }, [])
);
```

### Admin Protection Pattern

**Three layers (ALL required):**

1. **Route Config** (`app/(tabs)/_layout.tsx`):
```typescript
users: {
  title: 'Users',
  href: user?.role === 'admin' ? '/(tabs)/users' : null,  // Hide from non-admin
}
```

2. **Component Redirect**:
```typescript
useEffect(() => {
  if (user?.role !== 'admin') {
    router.replace('/(tabs)');
  }
}, [user]);
```

3. **Backend Middleware**: Already configured in API

## Code Quality Standards

### TypeScript
- Always define interfaces for data structures in `types/models.ts`
- Use strict null checks
- Avoid `any` type - use `unknown` and type guards
- Export reusable types

### Component Structure
```typescript
export default function ScreenName() {
  // State
  const [data, setData] = useState<Type | null>(null);
  
  // Context/hooks
  const { user } = useAuth();
  const router = useRouter();
  
  // Effects
  useEffect(() => {
    loadData();
  }, []);
  
  // Handlers
  const handleAction = async () => {
    // Implementation
  };
  
  // Render helpers
  const renderItem = () => {
    // Component
  };
  
  // Main render
  return (
    <Surface>
      {/* UI */}
    </Surface>
  );
}
```

### Styling

**Use React Native Paper theme:**
```typescript
import { useTheme } from 'react-native-paper';

const theme = useTheme();
const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    padding: 16,
  },
});
```

**Style Organization:**
- Define styles at bottom of file
- Use theme colors, not hardcoded values
- Use consistent spacing (8, 12, 16, 24)
- Name styles descriptively

### Error Handling

**User-Friendly Messages:**
```typescript
catch (error: any) {
  const message = error.message === 'insufficient_stock'
    ? 'Not enough stock available'
    : error.message || 'An error occurred';
  setError(message);
}
```

**Snackbar for Feedback:**
```typescript
const [snackbarVisible, setSnackbarVisible] = useState(false);
const [snackbarMessage, setSnackbarMessage] = useState('');

const showSnackbar = (message: string) => {
  setSnackbarMessage(message);
  setSnackbarVisible(true);
};

<Snackbar
  visible={snackbarVisible}
  onDismiss={() => setSnackbarVisible(false)}
  duration={3000}
>
  {snackbarMessage}
</Snackbar>
```

## Key Features Implementation

### Order Lifecycle Display

Orders have three independent states:

```typescript
// Payment Status
const getPaymentStatus = (order: Order) => {
  if (order.isPaid) return 'Paid';
  if (order.paymentSubmitted) return 'Awaiting Confirmation';
  return 'Not Paid';
};

// Delivery Status
const getDeliveryStatus = (order: Order) => {
  if (order.status === 'completed' || order.status === 'delivered') 
    return 'Delivered';
  return 'Awaiting Delivery';
};

// Pickup Status
const getPickupStatus = (order: Order) => {
  if (order.pickedUp) return 'Picked Up';
  return 'Awaiting Pickup';
};
```

### Payment Flow

```typescript
// User marks payment submitted
await apiService.markPaymentSubmitted(orderId);
// paymentSubmitted = true

// Admin confirms payment
await apiService.confirmPayment(orderId);
// isPaid = true

// Check for completion
// If paid + delivered + pickedUp → status = 'completed'
```

### Stock Availability

```typescript
// From API
const weeklyStock = await apiService.getWeeklyStock();
const availableEggs = await apiService.getAvailableEggs();

// Display
<Text>Available: {availableEggs} eggs</Text>

// Handle insufficient stock
if (quantity > availableEggs) {
  throw new Error('Insufficient stock available');
}
```

### Subscription Logic

```typescript
// Period validation
const period = 2; // or 3 or 4
const quantity = 20; // multiples of 10, max 30

// Start next week option
const startNextWeek = weeklyStock.allOrdersDelivered || availableEggs < quantity;

// Create subscription
await apiService.createSubscription(quantity, period, startNextWeek);

// Handle insufficient stock popup
if (error.message === 'insufficient_stock_this_week') {
  // Show popup with nextWeekStart and nextWeekEnd
}
```

### Payment QR Code (NBS IPS Format)

```typescript
import QRCode from 'react-native-qrcode-svg';

const qrData = `K:PR|V:01|C:1|R:${bankAccount}|N:${recipientName}|I:RSD${amountFormatted}|SF:${paymentCode}|S:${paymentPurpose}`;

// Amount format: RSD1750,00 (with comma, two decimals)
const formatAmount = (amount: number) => {
  return amount.toFixed(2).replace('.', ',');
};

<QRCode value={qrData} size={200} />
```

## Platform-Specific Code

### Date/Time Pickers

```typescript
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

{Platform.OS === 'web' ? (
  <input type="date" />
) : (
  <DateTimePicker mode="date" />
)}
```

### Responsive Layout

```typescript
const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  container: {
    maxWidth: isWeb ? 1200 : undefined,
    width: '100%',
    alignSelf: 'center',
  },
});
```

## Common Components Patterns

### Loading State

```typescript
{loading && <ActivityIndicator size="large" />}
{!loading && data && (
  <View>{/* Content */}</View>
)}
```

### Empty State

```typescript
{!loading && !data && (
  <View style={styles.emptyState}>
    <Text>No data available</Text>
  </View>
)}
```

### Button State

```typescript
<Button
  mode="contained"
  onPress={handleSubmit}
  disabled={loading || !isValid}
  loading={loading}
>
  {loading ? 'Processing...' : 'Submit'}
</Button>
```

### Conditional Rendering

```typescript
{user?.role === 'admin' && (
  <AdminOnlyComponent />
)}

{weeklyStock?.isOrderingOpen ? (
  <OrderForm />
) : (
  <Text>Ordering is closed</Text>
)}
```

## Navigation

### Router Hook

```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

// Navigate
router.push('/(tabs)/subscription');

// Replace (no back button)
router.replace('/(tabs)');

// Go back
router.back();
```

### Tab Configuration

In `app/(tabs)/_layout.tsx`:

```typescript
<Tabs.Screen
  name="screenName"
  options={{
    title: 'Title',
    tabBarIcon: ({ color }) => <Icon source="icon-name" color={color} />,
    href: user?.role === 'admin' ? '/(tabs)/screenName' : null,  // Admin only
  }}
/>
```

## API Response Handling

### Success Response

```typescript
const result = await apiService.createOrder(20);
// result = { id, userId, quantity, total, status, ... }
```

### Error Response

```typescript
try {
  await apiService.someMethod();
} catch (error: any) {
  // error.message = "Human-readable error message"
  // error.errors = { field: ["Validation error"] } (if validation error)
}
```

### Status Checks

```typescript
// Order can be modified?
if (order.status === 'pending' && !order.isPaid) {
  // Allow edit
}

// Order is complete?
if (order.status === 'completed') {
  // All done
}

// Stock available?
if (weeklyStock.allOrdersDelivered) {
  // Block new orders for this week
}
```

## Helper Functions

### Located in `utils/orderHelpers.ts`

```typescript
import * as orderHelpers from '@/utils/orderHelpers';

// Get total amount
const total = orderHelpers.getTotalAmount(oneTimeOrder, subscriptionOrder);

// Check payment status
const allPaid = orderHelpers.areAllOrdersPaid(oneTimeOrder, subscriptionOrder);

// Check completion
const complete = orderHelpers.areAllOrdersComplete(oneTimeOrder, subscriptionOrder);
```

**Always use helpers for order calculations to maintain consistency.**

## Styling Guidelines

### Colors
```typescript
- Primary: #7CB342 (Green)
- Error: #F44336 (Red)
- Success: #4CAF50 (Green)
- Warning: #FFA726 (Orange)
- Background: #F5F5F5
- Surface: #FFFFFF
```

### Spacing
```typescript
- xs: 4
- sm: 8
- md: 12
- lg: 16
- xl: 24
- xxl: 32
```

### Typography
```typescript
- Headings: Use Paper's <Title> component
- Body: Use Paper's <Text> variant
- Labels: Use Paper's <Text> with theme.fonts.labelSmall
```

### Cards
```typescript
<Card style={styles.card}>
  <Card.Title title="Title" subtitle="Subtitle" />
  <Card.Content>
    {/* Content */}
  </Card.Content>
  <Card.Actions>
    <Button>Action</Button>
  </Card.Actions>
</Card>
```

## Environment Variables

**Access Pattern:**
```typescript
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
```

**Important:**
- Prefix with `EXPO_PUBLIC_` for client-side access
- Set in `.env` file (local)
- Set in Railway dashboard (production)
- Variables are baked into build at compile time

## Testing Checklist

### Before Committing
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] No console.log statements (except intentional debug)
- [ ] All features work on web
- [ ] Admin features are protected
- [ ] Error states are handled
- [ ] Loading states are shown
- [ ] Currency displays as RSD (no decimals)

### User Flows to Test
1. Login/Logout
2. Place order → Pay → Pickup
3. Create subscription → View details → Cancel
4. Admin: Set stock → Confirm payments → Mark delivered
5. Admin: View users → User details

## Common Issues

### "AsyncStorage not found"
```bash
npx expo install @react-native-async-storage/async-storage
```

### "Module not found"
```bash
# Clear cache
npx expo start -c
```

### "API call fails"
- Check backend is running
- Check `EXPO_PUBLIC_API_URL` is correct
- Check CORS is configured on backend

### "Admin tab not showing"
- Check user role is 'admin' in AsyncStorage
- Check route `href` condition
- Check backend returns correct role

## Deployment

### Railway Production Build

**Dockerfile must use build args:**
```dockerfile
ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
RUN npx expo export -p web
```

**Railway environment variables:**
- `EXPO_PUBLIC_API_URL`: Backend API URL
- `EXPO_PUBLIC_APP_ENV`: `production`

### Build Verification

```bash
# Test production build locally
docker build --build-arg EXPO_PUBLIC_API_URL=http://localhost:8000/api -t frontend .
docker run -p 8081:8081 -e PORT=8081 frontend
```

## Best Practices

### Do's ✅
- Use `apiService` for all API calls
- Use `useFocusEffect` for screen-specific data loading
- Check user role before rendering admin components
- Handle loading and error states
- Use TypeScript interfaces
- Use theme colors, not hardcoded values
- Format currency as RSD without decimals
- Use React Native Paper components

### Don'ts ❌
- Don't use `fetch` directly
- Don't hardcode API URLs
- Don't skip error handling
- Don't use `any` type unless absolutely necessary
- Don't modify orders after payment
- Don't show decimals for RSD currency
- Don't render admin screens for customers
- Don't use `console.log` in production code

## Debugging

### Expo DevTools
```bash
# Open DevTools
Press 'd' in terminal

# Reload
Press 'r' in terminal

# Clear cache
Press 'Shift + c' in terminal
```

### React Native Debugger
```bash
# Enable in-app developer menu
Shake device (physical) or Cmd+D (iOS) / Cmd+M (Android)
```

### Common Debug Patterns
```typescript
// Log API responses
console.log('API Response:', JSON.stringify(result, null, 2));

// Log user state
console.log('Current User:', user);

// Log navigation
console.log('Navigating to:', route);
```

## When Making Changes

1. **Understand the feature** - Read existing code patterns
2. **Update types** - Add/modify interfaces in `types/models.ts`
3. **API service** - Add/modify methods in `services/api.ts`
4. **Component** - Implement UI with error/loading states
5. **Test** - Verify on web (minimum)
6. **Admin check** - If admin feature, add protection
7. **Documentation** - Update README if adding major features

## References

- **Expo Docs**: https://docs.expo.dev
- **React Native Paper**: https://callstack.github.io/react-native-paper/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Expo Router**: https://docs.expo.dev/router/introduction/

