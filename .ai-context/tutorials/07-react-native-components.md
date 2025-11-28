# Tutorial 7: React Native Components & JSX

## What is JSX/TSX?

**JSX** (JavaScript XML) lets you write HTML-like syntax in JavaScript.
**TSX** is JSX with TypeScript types.

### Compare to PHP/Laravel:

**Blade (Laravel):**
```blade
<div class="container">
  <h1>{{ $title }}</h1>
  <p>{{ $content }}</p>
</div>
```

**JSX (React Native):**
```jsx
<View style={styles.container}>
  <Text style={styles.title}>{title}</Text>
  <Text>{content}</Text>
</View>
```

**Key differences:**
- `class` → `style` (uses JavaScript objects)
- `{{ }}` → `{ }` (single braces)
- HTML tags → React Native components

---

## Core React Native Components

React Native doesn't use HTML tags. It has its own components:

| HTML | React Native | Purpose |
|------|--------------|---------|
| `<div>` | `<View>` | Container |
| `<p>`, `<h1>`, `<span>` | `<Text>` | Text content |
| `<button>` | `<Pressable>` or `<Button>` | Clickable element |
| `<input>` | `<TextInput>` | Text input |
| `<img>` | `<Image>` | Images |
| `<ul>`/`<li>` | `<FlatList>` or `<ScrollView>` | Lists |

---

## Basic Components Explained

### 1. View (Container)

Like `<div>` in HTML - groups other components.

```tsx
import { View } from 'react-native';

<View>
  <Text>Hello!</Text>
  <Text>Welcome!</Text>
</View>
```

**Use for:**
- Layout containers
- Grouping elements
- Styling sections

---

### 2. Text (Display Text)

**ALL text must be in `<Text>` components!**

```tsx
import { Text } from 'react-native';

<Text>Hello World</Text>
<Text style={{ fontSize: 24, color: 'blue' }}>
  Big Blue Text
</Text>
```

**Important:** This won't work:
```tsx
<View>
  Hello World  ❌ Text not in <Text> component!
</View>
```

**Do this instead:**
```tsx
<View>
  <Text>Hello World</Text> ✅
</View>
```

---

### 3. Pressable (Clickable)

For tappable/clickable elements.

```tsx
import { Pressable, Text } from 'react-native';

<Pressable onPress={() => alert('Pressed!')}>
  <Text>Click Me</Text>
</Pressable>
```

**Think of it like `<button>` or `<a>` in HTML.**

**Common props:**
- `onPress`: Function to call when pressed
- `disabled`: Disable the button
- `style`: Styling

---

### 4. TextInput (Input Fields)

For user text input.

```tsx
import { TextInput } from 'react-native';

const [text, setText] = useState('');

<TextInput
  value={text}
  onChangeText={setText}
  placeholder="Enter your name"
  style={{ borderWidth: 1, padding: 10 }}
/>
```

**Compare to HTML:**
```html
<!-- HTML -->
<input 
  value="..." 
  onchange="..." 
  placeholder="..."
/>
```

---

### 5. Image

Display images.

```tsx
import { Image } from 'react-native';

// Local image
<Image 
  source={require('./assets/logo.png')}
  style={{ width: 100, height: 100 }}
/>

// Remote image
<Image 
  source={{ uri: 'https://example.com/image.jpg' }}
  style={{ width: 100, height: 100 }}
/>
```

---

### 6. ScrollView (Scrollable Container)

Makes content scrollable.

```tsx
import { ScrollView, Text } from 'react-native';

<ScrollView>
  <Text>Item 1</Text>
  <Text>Item 2</Text>
  <Text>Item 3</Text>
  {/* Many more items... */}
</ScrollView>
```

---

### 7. FlatList (Efficient Lists)

For long lists - only renders visible items (like Laravel pagination).

```tsx
import { FlatList, Text } from 'react-native';

const eggs = [
  { id: '1', name: 'Free Range' },
  { id: '2', name: 'Organic' },
  { id: '3', name: 'Cage Free' }
];

<FlatList
  data={eggs}
  renderItem={({ item }) => <Text>{item.name}</Text>}
  keyExtractor={item => item.id}
/>
```

**Compare to Blade:**
```blade
@foreach($eggs as $egg)
  <div>{{ $egg->name }}</div>
@endforeach
```

---

## Styling in React Native

No CSS files! Styles are JavaScript objects.

### StyleSheet.create()

```tsx
import { StyleSheet, View, Text } from 'react-native';

export default function MyComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
});
```

### Inline Styles

```tsx
<Text style={{ fontSize: 20, color: 'blue' }}>
  Inline styled text
</Text>
```

### Combining Styles

```tsx
<View style={[styles.container, { padding: 20 }]}>
  {/* Combines container styles + extra padding */}
</View>
```

---

## Common Style Properties

### Layout
```tsx
{
  flex: 1,              // Fill available space
  flexDirection: 'row', // horizontal layout (default: 'column')
  alignItems: 'center', // cross-axis alignment
  justifyContent: 'center', // main-axis alignment
  padding: 10,
  margin: 20,
}
```

### Text
```tsx
{
  fontSize: 16,
  fontWeight: 'bold',  // 'normal', 'bold', '100'-'900'
  color: '#333',
  textAlign: 'center', // 'left', 'right', 'center'
}
```

### Background & Borders
```tsx
{
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 8,
}
```

---

## React Hooks Basics

Hooks let you use state and other React features.

### useState (State Management)

```tsx
import { useState } from 'react';

function Counter() {
  // [currentValue, functionToUpdate]
  const [count, setCount] = useState(0);

  return (
    <View>
      <Text>Count: {count}</Text>
      <Pressable onPress={() => setCount(count + 1)}>
        <Text>Increment</Text>
      </Pressable>
    </View>
  );
}
```

**Think of it like:**
- `$count` in Blade (the value)
- `setCount()` updates it and triggers re-render

### useEffect (Side Effects)

Runs code when component mounts or when values change.

```tsx
import { useEffect, useState } from 'react';

function UserProfile() {
  const [user, setUser] = useState(null);

  // Runs once when component loads
  useEffect(() => {
    fetchUser().then(data => setUser(data));
  }, []); // Empty array = run once

  return <Text>{user?.name}</Text>;
}
```

**Like lifecycle hooks in Laravel or mounting in Vue.**

---

## Component Structure

### Functional Component Pattern

```tsx
import { View, Text, StyleSheet } from 'react-native';

// 1. Props interface (TypeScript)
interface WelcomeProps {
  name: string;
  showGreeting?: boolean;
}

// 2. Component function
export default function Welcome({ name, showGreeting = true }: WelcomeProps) {
  // 3. State (if needed)
  const [count, setCount] = useState(0);

  // 4. Functions
  const handlePress = () => {
    setCount(count + 1);
  };

  // 5. Return JSX
  return (
    <View style={styles.container}>
      {showGreeting && <Text>Hello, {name}!</Text>}
      <Text>You pressed {count} times</Text>
      <Pressable onPress={handlePress}>
        <Text>Press me</Text>
      </Pressable>
    </View>
  );
}

// 6. Styles
const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
});
```

---

## JSX Rules

### 1. Single Parent Element

```tsx
// ❌ Won't work - multiple roots
return (
  <Text>Hello</Text>
  <Text>World</Text>
);

// ✅ Works - wrapped in parent
return (
  <View>
    <Text>Hello</Text>
    <Text>World</Text>
  </View>
);

// ✅ Or use Fragment
return (
  <>
    <Text>Hello</Text>
    <Text>World</Text>
  </>
);
```

### 2. JavaScript Expressions in { }

```tsx
const name = "John";
const age = 25;

<View>
  <Text>{name}</Text>           {/* Variable */}
  <Text>{age + 5}</Text>         {/* Expression */}
  <Text>{name.toUpperCase()}</Text> {/* Method */}
</View>
```

### 3. Conditional Rendering

```tsx
// Using &&
{isLoggedIn && <Text>Welcome back!</Text>}

// Using ternary
{isLoggedIn ? <Text>Logged in</Text> : <Text>Please log in</Text>}

// Using variable
const greeting = isLoggedIn ? 'Welcome!' : 'Please log in';
<Text>{greeting}</Text>
```

### 4. Lists / Loops

```tsx
const items = ['Apple', 'Banana', 'Orange'];

<View>
  {items.map((item, index) => (
    <Text key={index}>{item}</Text>
  ))}
</View>
```

---

## Common Patterns

### Loading State

```tsx
const [loading, setLoading] = useState(true);
const [data, setData] = useState(null);

if (loading) {
  return <Text>Loading...</Text>;
}

return <Text>{data}</Text>;
```

### Error Handling

```tsx
const [error, setError] = useState(null);

if (error) {
  return <Text>Error: {error.message}</Text>;
}
```

### Form Input

```tsx
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

<TextInput
  value={email}
  onChangeText={setEmail}
  placeholder="Email"
/>
<TextInput
  value={password}
  onChangeText={setPassword}
  placeholder="Password"
  secureTextEntry
/>
<Pressable onPress={handleLogin}>
  <Text>Login</Text>
</Pressable>
```

---

## For Egg9 Project

We'll use these components to build:
- Product listings (FlatList)
- Forms for orders (TextInput, Pressable)
- Navigation between screens
- User authentication UI

---

## Quick Reference

```tsx
// Import
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';

// Component
export default function MyScreen() {
  const [value, setValue] = useState('');
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Title</Text>
      <Pressable onPress={() => alert('Hi!')}>
        <Text>Press</Text>
      </Pressable>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
});
```

Now you're ready to build! 🚀

