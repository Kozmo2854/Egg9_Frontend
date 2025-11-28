# Tutorial 2: What is React Native?

## Understanding React Native

**React Native** is a framework for building mobile applications using JavaScript and React.

---

## The Progression: Web → Mobile

### 1. **HTML/CSS/JavaScript** 
   - Build websites that run in web browsers

### 2. **React** (JavaScript library)
   - Build interactive web applications more easily
   - Uses "components" - reusable pieces of UI
   - Manages state (data that changes over time)

### 3. **React Native** (Framework)
   - Uses React concepts but builds **native mobile apps**
   - Write code once, run on iOS, Android, and (with React Native Web) the web!

---

## Native vs Web Apps

### Traditional Native Apps:
- **iOS**: Written in Swift or Objective-C
- **Android**: Written in Kotlin or Java
- **Problem**: Need to write the same app twice (different languages!)

### React Native Solution:
- Write **once** in JavaScript
- React Native translates it to native iOS and Android components
- Gets **real native performance** (not a web view!)

---

## How It Works

```
Your JavaScript Code
        ↓
React Native Bridge
        ↓
Native iOS/Android Components
```

### Example:

```javascript
// You write:
<View>
  <Text>Hello World!</Text>
</View>

// React Native creates:
// iOS: UIView with UILabel
// Android: View with TextView
```

---

## Key Concepts

### 1. **Components**
Building blocks of your UI. Like LEGO pieces you combine.

```javascript
// A simple component
function WelcomeMessage() {
  return <Text>Welcome to Egg9!</Text>;
}
```

### 2. **JSX**
Looks like HTML but it's JavaScript! Lets you write UI code that's easy to read.

```javascript
const element = <Text>Hello!</Text>;
```

### 3. **Props**
Data passed from parent to child components (like function parameters).

```javascript
<WelcomeMessage name="John" />
```

### 4. **State**
Data that changes over time (like user input, API data, etc.).

```javascript
const [eggCount, setEggCount] = useState(12);
```

---

## React Native vs Expo (Preview)

### React Native (bare):
- Full control, more complex setup
- Need iOS/Android development tools installed

### Expo (what we'll use):
- Easier setup, batteries included
- Great for beginners and most apps
- Can "eject" to bare React Native if needed

We'll learn more about Expo in the next tutorial!

---

## For Egg9 Project:

We're building:
- ✅ Mobile app (iOS & Android)
- ✅ Web app (same codebase!)
- ✅ Using React Native with Expo
- ✅ Writing JavaScript once for all platforms

This means you'll learn React Native and be able to build apps for any platform! 🎉

