# Tutorial 5: TypeScript Basics

## What is TypeScript?

**TypeScript = JavaScript + Type Safety**

Think of it like this:
- **JavaScript**: "Hey, this variable is called `age`"
- **TypeScript**: "Hey, this variable is called `age` and it's a NUMBER"

---

## Why Use TypeScript?

### Without TypeScript (JavaScript):
```javascript
function addEggs(count) {
  return count + 12;
}

addEggs(5);        // ✅ Works! Returns 17
addEggs("hello");  // ⚠️ Runs but gives "hello12" (bug!)
```

### With TypeScript:
```typescript
function addEggs(count: number) {
  return count + 12;
}

addEggs(5);        // ✅ Works! Returns 17
addEggs("hello");  // ❌ Error BEFORE running!
                   // Editor shows: "Argument of type 'string' is not assignable to parameter of type 'number'"
```

**TypeScript catches mistakes before you run the code!**

---

## Basic Types

### Primitives

```typescript
// String
let name: string = "Eggs9";
let greeting: string = 'Hello';

// Number
let price: number = 5.99;
let quantity: number = 12;

// Boolean
let inStock: boolean = true;
let isSubscription: boolean = false;

// Any (avoid this - defeats the purpose!)
let anything: any = "could be anything";
```

### Arrays

```typescript
// Array of numbers
let prices: number[] = [5.99, 12.50, 8.00];

// Array of strings
let names: string[] = ["John", "Jane", "Bob"];

// Alternative syntax
let ids: Array<number> = [1, 2, 3];
```

### Objects

```typescript
// Object type
let egg: {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
} = {
  id: 1,
  name: "Free Range Eggs",
  price: 5.99,
  inStock: true
};
```

---

## Interfaces

**Better way to define object shapes:**

```typescript
// Define the structure
interface Egg {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

// Use it
let egg1: Egg = {
  id: 1,
  name: "Free Range Eggs",
  price: 5.99,
  inStock: true
};

let egg2: Egg = {
  id: 2,
  name: "Organic Eggs",
  price: 7.99,
  inStock: false
};
```

**Think of interfaces like database table schemas - they define the structure!**

---

## Functions

### Function Parameters and Return Types

```typescript
// Function with typed parameters and return type
function calculateTotal(price: number, quantity: number): number {
  return price * quantity;
}

// Using the function
let total = calculateTotal(5.99, 12); // ✅ total is automatically known to be a number

calculateTotal("5.99", 12); // ❌ Error: string is not assignable to number
```

### Optional Parameters

```typescript
function greet(name: string, title?: string): string {
  if (title) {
    return `Hello, ${title} ${name}`;
  }
  return `Hello, ${name}`;
}

greet("John");              // ✅ "Hello, John"
greet("Jane", "Dr.");       // ✅ "Hello, Dr. Jane"
```

### Arrow Functions

```typescript
// Arrow function with types
const add = (a: number, b: number): number => {
  return a + b;
};

// Shorter version
const multiply = (a: number, b: number): number => a * b;
```

---

## Union Types

**A value can be one of several types:**

```typescript
// Can be string OR number
let id: string | number;

id = 123;      // ✅ Valid
id = "ABC123"; // ✅ Valid
id = true;     // ❌ Error

// Useful for function parameters
function printId(id: string | number) {
  console.log(`Your ID is: ${id}`);
}

printId(123);      // ✅ Works
printId("ABC");    // ✅ Works
```

---

## Type Aliases

**Create reusable custom types:**

```typescript
// Define a type
type ID = string | number;
type Status = "pending" | "approved" | "declined";

// Use it
let orderId: ID = 123;
let orderStatus: Status = "pending";

orderStatus = "approved";  // ✅ Valid
orderStatus = "cancelled"; // ❌ Error: not in the allowed values
```

---

## React Component Types

### Component Props

```typescript
// Define prop types for a component
interface ButtonProps {
  title: string;
  onPress: () => void;  // function that returns nothing
  disabled?: boolean;   // optional
}

// Use in component
function Button({ title, onPress, disabled }: ButtonProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <Text>{title}</Text>
    </Pressable>
  );
}

// Usage
<Button 
  title="Buy Eggs" 
  onPress={() => console.log("Bought!")}
/>
```

### State Types

```typescript
// TypeScript knows the type!
const [count, setCount] = useState<number>(0);
const [name, setName] = useState<string>("");
const [eggs, setEggs] = useState<Egg[]>([]);

// Can also infer from initial value
const [isOpen, setIsOpen] = useState(false); // automatically boolean
```

---

## Common TypeScript in React Native

### Event Handlers

```typescript
// Press event
const handlePress = (): void => {
  console.log("Pressed!");
};

// Text input
const handleChange = (text: string): void => {
  setName(text);
};
```

### Component with Full Types

```typescript
interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  onPress: (id: number) => void;
}

function ProductCard({ id, name, price, onPress }: ProductCardProps) {
  return (
    <Pressable onPress={() => onPress(id)}>
      <Text>{name}</Text>
      <Text>${price.toFixed(2)}</Text>
    </Pressable>
  );
}
```

---

## TypeScript vs JavaScript: Quick Comparison

| JavaScript | TypeScript |
|------------|------------|
| `let count = 0;` | `let count: number = 0;` |
| `function add(a, b) { }` | `function add(a: number, b: number): number { }` |
| `const user = { }` | `const user: User = { }` |
| Errors at runtime | Errors while coding |
| No autocomplete for types | Great autocomplete! |

---

## Don't Worry!

**You can write regular JavaScript in `.tsx` files!**

TypeScript is **optional** - you can gradually learn and add types as you go.

### Start simple:

```typescript
// This works fine without types
function Welcome() {
  const [name, setName] = useState(""); // Type inferred automatically!
  
  return <Text>Hello {name}</Text>;
}
```

### Add types when you're ready:

```typescript
// More explicit with types
function Welcome(): JSX.Element {
  const [name, setName] = useState<string>("");
  
  return <Text>Hello {name}</Text>;
}
```

---

## For Egg9 Project

We'll start simple and add types as we learn! The editor (VS Code/Cursor) will help with autocomplete and error detection.

**Key takeaway:** TypeScript helps you catch bugs early and makes coding easier with better autocomplete!

---

## Quick Reference

```typescript
// Basic types
let str: string = "text";
let num: number = 42;
let bool: boolean = true;
let arr: number[] = [1, 2, 3];

// Interface
interface User {
  id: number;
  name: string;
}

// Function
function greet(name: string): string {
  return `Hello ${name}`;
}

// Component props
interface Props {
  title: string;
  count: number;
}
```

Ready to see your app in action? 🎯

