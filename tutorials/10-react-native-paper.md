# React Native Paper Tutorial

## What is React Native Paper?

React Native Paper is a high-quality, production-ready component library for React Native that implements Google's Material Design 3 (MD3) guidelines. It provides a collection of customizable, themeable, and accessible UI components that work seamlessly across iOS, Android, and Web platforms.

Think of it as a comprehensive UI toolkit that gives your app a modern, polished look without having to build every component from scratch.

## Why We Use It

### 1. **Cross-Platform Consistency**
Paper components look and behave consistently across iOS, Android, and Web. You write once, and it adapts to each platform's nuances automatically.

### 2. **Material Design**
Material Design is Google's design system - it's familiar to users, provides excellent UX patterns, and looks modern and professional.

### 3. **Production-Ready**
All components are:
- **Accessible** (screen reader support, keyboard navigation)
- **Performant** (optimized for mobile)
- **Well-tested** (used by thousands of apps)
- **Maintained** (regular updates and bug fixes)

### 4. **Theming System**
Easy to customize colors, fonts, and styling globally - change your entire app's look with one theme object.

### 5. **Rich Component Library**
Provides 40+ components including buttons, cards, inputs, dialogs, snackbars, and more - all following best practices.

## Installation

```bash
npm install react-native-paper react-native-safe-area-context
```

**Dependencies:**
- `react-native-paper`: The component library itself
- `react-native-safe-area-context`: Handles safe areas (notches, status bars, etc.)

## Setup

### 1. Wrap Your App with PaperProvider

The `PaperProvider` is the root component that provides theme and configuration to all Paper components.

**In `app/_layout.tsx`:**

```typescript
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Custom theme
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#f97316',      // Orange (your brand color)
    secondary: '#0891b2',    // Cyan (accent)
    tertiary: '#22c55e',     // Green (success)
    background: '#f9fafb',   // Light gray background
    surface: '#ffffff',      // White cards/surfaces
    error: '#dc2626',        // Red for errors
  },
};

// In your render:
<PaperProvider theme={lightTheme}>
  {/* Your app content */}
</PaperProvider>
```

### 2. Theme Customization

**Theme Object Structure:**
```typescript
{
  colors: {
    primary: string;        // Main brand color
    secondary: string;      // Secondary brand color
    tertiary: string;       // Third brand color
    background: string;     // App background
    surface: string;        // Card/panel background
    error: string;          // Error state color
    // ... many more
  },
  fonts: {
    // Font configuration
  },
  roundness: number,        // Border radius (default: 4)
}
```

### 3. Using the Theme in Components

```typescript
import { useTheme } from 'react-native-paper';

function MyComponent() {
  const theme = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.primary }}>
      <Text style={{ color: theme.colors.onPrimary }}>
        Hello!
      </Text>
    </View>
  );
}
```

## Core Components

### 1. **Text** - Enhanced Typography

Paper's `Text` component provides variants for consistent typography:

```typescript
import { Text } from 'react-native-paper';

<Text variant="displayLarge">Display Large</Text>
<Text variant="displayMedium">Display Medium</Text>
<Text variant="displaySmall">Display Small</Text>
<Text variant="headlineLarge">Headline Large</Text>
<Text variant="headlineMedium">Headline Medium</Text>
<Text variant="headlineSmall">Headline Small</Text>
<Text variant="titleLarge">Title Large</Text>
<Text variant="titleMedium">Title Medium</Text>
<Text variant="titleSmall">Title Small</Text>
<Text variant="bodyLarge">Body Large</Text>
<Text variant="bodyMedium">Body Medium</Text>
<Text variant="bodySmall">Body Small</Text>
<Text variant="labelLarge">Label Large</Text>
```

**Why Use Variants?**
- **Consistency**: Same text style everywhere
- **Responsive**: Adapts to platform defaults
- **Accessible**: Correct font sizes for readability

### 2. **Button** - Modern Action Buttons

Paper buttons come in different modes:

```typescript
import { Button } from 'react-native-paper';

// Contained (filled background)
<Button mode="contained" onPress={() => {}}>
  Primary Action
</Button>

// Outlined (border only)
<Button mode="outlined" onPress={() => {}}>
  Secondary Action
</Button>

// Text (no background)
<Button mode="text" onPress={() => {}}>
  Tertiary Action
</Button>

// With icon
<Button mode="contained" icon="camera" onPress={() => {}}>
  Take Photo
</Button>

// Loading state
<Button mode="contained" loading={true}>
  Processing...
</Button>

// Disabled
<Button mode="contained" disabled={true}>
  Disabled
</Button>
```

**Props:**
- `mode`: 'contained' | 'outlined' | 'text' | 'elevated'
- `icon`: Icon name from MaterialCommunityIcons
- `loading`: Shows spinner
- `disabled`: Disables interaction
- `onPress`: Click handler
- `contentStyle`: Style the button content area
- `buttonColor`: Override button color
- `textColor`: Override text color

### 3. **TextInput** - Enhanced Input Fields

Paper's TextInput has built-in validation, icons, and styling:

```typescript
import { TextInput } from 'react-native-paper';

// Outlined style (most common)
<TextInput
  label="Email"
  value={email}
  onChangeText={setEmail}
  mode="outlined"
  keyboardType="email-address"
  autoCapitalize="none"
  error={!!emailError}
  left={<TextInput.Icon icon="email" />}
/>

// Flat style
<TextInput
  label="Password"
  value={password}
  onChangeText={setPassword}
  mode="flat"
  secureTextEntry={!showPassword}
  right={
    <TextInput.Icon 
      icon={showPassword ? "eye-off" : "eye"}
      onPress={() => setShowPassword(!showPassword)}
    />
  }
/>
```

**Props:**
- `label`: Floating label text
- `value`: Current value
- `onChangeText`: Change handler
- `mode`: 'outlined' | 'flat'
- `error`: Boolean, shows error state (red outline)
- `disabled`: Disables input
- `left`/`right`: Add icons
- `secureTextEntry`: For passwords
- All standard TextInput props (keyboardType, autoCapitalize, etc.)

**Validation Example:**
```typescript
<TextInput
  label="Email"
  value={email}
  onChangeText={setEmail}
  mode="outlined"
  error={!!emailError}
/>
{emailError && (
  <Text variant="bodySmall" style={{ color: 'red' }}>
    {emailError}
  </Text>
)}
```

### 4. **Card** - Content Containers

Cards group related information with elevation and borders:

```typescript
import { Card } from 'react-native-paper';

<Card mode="elevated">
  <Card.Content>
    <Text variant="titleLarge">Card Title</Text>
    <Text variant="bodyMedium">Card content goes here</Text>
  </Card.Content>
</Card>

// With actions
<Card mode="outlined">
  <Card.Title title="User Profile" subtitle="Active" />
  <Card.Content>
    <Text>Details here</Text>
  </Card.Content>
  <Card.Actions>
    <Button>Cancel</Button>
    <Button>OK</Button>
  </Card.Actions>
</Card>

// With cover image
<Card>
  <Card.Cover source={{ uri: 'https://example.com/image.jpg' }} />
  <Card.Content>
    <Text>Beautiful image above</Text>
  </Card.Content>
</Card>
```

**Parts:**
- `Card.Title`: Title and subtitle area
- `Card.Content`: Main content area
- `Card.Cover`: Full-width image
- `Card.Actions`: Button area at bottom

**Modes:**
- `elevated`: Shadow/elevation (default)
- `outlined`: Border, no shadow
- `contained`: Filled background

### 5. **Surface** - Generic Container

Surface is like a Card but simpler - just a container with background and elevation:

```typescript
import { Surface } from 'react-native-paper';

<Surface style={styles.surface} elevation={2}>
  <Text>I'm on a surface!</Text>
</Surface>
```

**Props:**
- `elevation`: 0-5, controls shadow depth
- `style`: Custom styling

**Use Cases:**
- Status boxes
- Info panels
- Any container that needs background color and subtle shadow

### 6. **Chip** - Compact Labels/Tags

Chips are small, compact elements for labels, tags, or quick actions:

```typescript
import { Chip } from 'react-native-paper';

// Basic chip
<Chip icon="information">Info</Chip>

// Selected state
<Chip selected={true}>Selected</Chip>

// Closeable
<Chip onClose={() => {}}>Remove me</Chip>

// Different modes
<Chip mode="flat">Flat</Chip>
<Chip mode="outlined">Outlined</Chip>
```

**Use Cases:**
- Status indicators (Active, Pending)
- Tags (Subscription, One-Time)
- Filters
- Counts

### 7. **Snackbar** - Toast Notifications

Snackbars show brief messages at the bottom of the screen:

```typescript
import { Snackbar } from 'react-native-paper';

const [visible, setVisible] = useState(false);

<Snackbar
  visible={visible}
  onDismiss={() => setVisible(false)}
  duration={3000}
  action={{
    label: 'Undo',
    onPress: () => {
      // Handle undo
    },
  }}
>
  Order placed successfully!
</Snackbar>
```

**Props:**
- `visible`: Show/hide snackbar
- `onDismiss`: Callback when dismissed
- `duration`: Auto-dismiss time (ms), or `Snackbar.DURATION_SHORT` / `DURATION_LONG`
- `action`: Optional action button
- `style`: Custom background color

**Best Practices:**
- Use for success messages
- Use for non-critical errors
- Keep messages short
- Provide undo action when appropriate

### 8. **Banner** - Prominent Messaging

Banners display important, persistent messages at the top:

```typescript
import { Banner } from 'react-native-paper';

const [visible, setVisible] = useState(true);

<Banner
  visible={visible}
  actions={[
    {
      label: 'Got it',
      onPress: () => setVisible(false),
    },
  ]}
  icon="information"
>
  Important: Read these instructions!
</Banner>
```

**Use Cases:**
- Announcements
- Important notices
- Help text
- Feature introductions

### 9. **IconButton** - Compact Icon Actions

IconButton is for icon-only buttons:

```typescript
import { IconButton } from 'react-native-paper';

<IconButton
  icon="camera"
  size={20}
  onPress={() => {}}
  iconColor="#f97316"
/>

// In a quantity selector
<View style={{ flexDirection: 'row' }}>
  <IconButton icon="minus-circle" onPress={decrement} />
  <Text>{quantity}</Text>
  <IconButton icon="plus-circle" onPress={increment} />
</View>
```

**Props:**
- `icon`: Icon name
- `size`: Icon size (default: 24)
- `iconColor`: Icon color
- `disabled`: Disable button
- `onPress`: Click handler

### 10. **ActivityIndicator** - Loading Spinner

Shows loading state:

```typescript
import { ActivityIndicator } from 'react-native-paper';

<ActivityIndicator animating={true} color="#f97316" size="large" />

// In a button (built-in)
<Button loading={true}>Processing...</Button>
```

### 11. **Divider** - Visual Separator

Thin line to separate content:

```typescript
import { Divider } from 'react-native-paper';

<Text>Section 1</Text>
<Divider />
<Text>Section 2</Text>

// Vertical divider
<View style={{ flexDirection: 'row' }}>
  <Text>Left</Text>
  <Divider style={{ width: 1, height: 50 }} />
  <Text>Right</Text>
</View>
```

### 12. **DataTable** - Structured Tables

Display tabular data (great for admin panels):

```typescript
import { DataTable } from 'react-native-paper';

<DataTable>
  <DataTable.Header>
    <DataTable.Title>User</DataTable.Title>
    <DataTable.Title numeric>Quantity</DataTable.Title>
    <DataTable.Title numeric>Price</DataTable.Title>
  </DataTable.Header>

  <DataTable.Row>
    <DataTable.Cell>John Doe</DataTable.Cell>
    <DataTable.Cell numeric>20</DataTable.Cell>
    <DataTable.Cell numeric>$11.98</DataTable.Cell>
  </DataTable.Row>
  
  <DataTable.Row>
    <DataTable.Cell>Jane Smith</DataTable.Cell>
    <DataTable.Cell numeric>30</DataTable.Cell>
    <DataTable.Cell numeric>$17.97</DataTable.Cell>
  </DataTable.Row>
</DataTable>
```

**Props:**
- `numeric`: Right-align cell (for numbers)
- Supports sorting (add `sortDirection` and `onPress` to Title)
- Supports pagination

## Material Icons

Paper uses MaterialCommunityIcons. Browse all icons at: https://materialdesignicons.com/

Common icons used in Egg9:
- `email`, `lock`: Authentication
- `cart`, `calendar-repeat`: Orders/Subscriptions
- `plus-circle`, `minus-circle`: Quantity controls
- `check`, `close`: Confirmations
- `pencil`, `delete`: Edit/Delete actions
- `calendar`, `clock-outline`: Date/Time
- `information`, `alert`: Notifications

## Theming Deep Dive

### Color System

Material Design uses a sophisticated color system:

```typescript
colors: {
  primary: '#f97316',           // Main brand color
  onPrimary: '#ffffff',         // Text on primary
  primaryContainer: '#ffedd5',  // Lighter variant
  onPrimaryContainer: '#9a3412', // Text on light variant
  
  secondary: '#0891b2',
  onSecondary: '#ffffff',
  // ... (similar pattern for all colors)
  
  background: '#f9fafb',        // App background
  onBackground: '#000000',      // Text on background
  
  surface: '#ffffff',           // Card background
  onSurface: '#000000',         // Text on cards
  
  error: '#dc2626',
  onError: '#ffffff',
}
```

**"On" Colors:**
The "on" prefix means "color for text/icons displayed on top of this color". Paper automatically uses the right "on" color for contrast.

**Container Colors:**
"Container" variants are lighter/darker versions for less emphasis.

### Dark Mode

```typescript
const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#fb923c',        // Lighter for dark backgrounds
    // ...
  },
};

// In your app:
const colorScheme = useColorScheme();
const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

<PaperProvider theme={theme}>
  {/* App */}
</PaperProvider>
```

## Best Practices

### 1. **Use Variants Consistently**
Don't mix-and-match text styles randomly. Use the Typography scale:
- `displayLarge/Medium/Small`: Page titles, hero text
- `headlineLarge/Medium/Small`: Section headers
- `titleLarge/Medium/Small`: Card titles, list items
- `bodyLarge/Medium/Small`: Body text, descriptions
- `labelLarge/Medium/Small`: Labels, captions

### 2. **Elevation Hierarchy**
- Level 0: Background
- Level 1: Cards at rest
- Level 2: Raised buttons, app bars
- Level 3: Dialogs, dropdowns
- Level 4: Modals
- Level 5: Floating action buttons

### 3. **Component Composition**
Build complex UIs by composing simple components:

```typescript
<Card mode="elevated">
  <Card.Content>
    <View style={styles.row}>
      <Chip icon="check-circle">Active</Chip>
      <IconButton icon="dots-vertical" onPress={showMenu} />
    </View>
    <Text variant="titleLarge">Order #1234</Text>
    <Divider style={styles.divider} />
    <Text variant="bodyMedium">Details here...</Text>
  </Card.Content>
  <Card.Actions>
    <Button mode="outlined">Cancel</Button>
    <Button mode="contained">Confirm</Button>
  </Card.Actions>
</Card>
```

### 4. **Accessibility**
Paper components are accessible by default, but you can enhance:

```typescript
<Button 
  mode="contained"
  accessibilityLabel="Place your order"
  accessibilityHint="Confirms and submits your egg order"
>
  Order Now
</Button>
```

### 5. **Performance**
- Use `mode="outlined"` or `"flat"` for cards/surfaces when you don't need elevation
- Elevation creates shadows which can impact performance on large lists
- Memoize complex components

## Migration from Custom Styles

**Before (Custom Components):**
```typescript
<Pressable style={[styles.button, processing && styles.buttonDisabled]}>
  {processing ? <ActivityIndicator /> : <Text>Submit</Text>}
</Pressable>
```

**After (Paper):**
```typescript
<Button 
  mode="contained" 
  loading={processing} 
  disabled={processing}
>
  Submit
</Button>
```

**Benefits:**
- Less code
- Built-in loading states
- Consistent styling
- Better accessibility
- Automatic theme support

## Common Patterns in Egg9

### 1. **Form with Validation**
```typescript
<TextInput
  label="Email"
  value={email}
  onChangeText={setEmail}
  mode="outlined"
  error={!!errors.email}
  left={<TextInput.Icon icon="email" />}
/>
{errors.email && (
  <Text variant="bodySmall" style={{ color: theme.colors.error }}>
    {errors.email}
  </Text>
)}
```

### 2. **Status Display**
```typescript
<Surface style={[styles.box, { backgroundColor: theme.colors.primaryContainer }]}>
  <Text style={{ color: theme.colors.onPrimaryContainer }}>
    ✓ Order Placed
  </Text>
</Surface>
```

### 3. **Data Cards**
```typescript
<Card mode="elevated">
  <Card.Content>
    <View style={styles.headerRow}>
      <Text variant="titleLarge">Weekly Stock</Text>
      <Chip icon="package">250</Chip>
    </View>
    <Divider style={styles.divider} />
    <Text variant="bodyMedium">Details...</Text>
  </Card.Content>
</Card>
```

### 4. **Action with Feedback**
```typescript
const [message, setMessage] = useState('');

const handleAction = async () => {
  try {
    await apiService.doSomething();
    setMessage('Success!');
  } catch (error) {
    setMessage('Error!');
  }
};

return (
  <>
    <Button mode="contained" onPress={handleAction}>
      Do Action
    </Button>
    
    <Snackbar
      visible={!!message}
      onDismiss={() => setMessage('')}
      duration={3000}
    >
      {message}
    </Snackbar>
  </>
);
```

## Resources

- **Official Docs**: https://callstack.github.io/react-native-paper/
- **Component Showcase**: https://callstack.github.io/react-native-paper/showcase.html
- **Icons**: https://materialdesignicons.com/
- **Material Design**: https://m3.material.io/

## Summary

React Native Paper transforms your React Native app by providing:
- ✅ Beautiful, modern UI components
- ✅ Consistent theming system
- ✅ Cross-platform compatibility
- ✅ Built-in accessibility
- ✅ Production-ready components
- ✅ Less code, more features

In Egg9, we've used Paper to create a professional, polished UI that works seamlessly on iOS, Android, and Web with minimal code and maximum user experience.

