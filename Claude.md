# Claude AI Assistant - Project Guidelines

## Role & Approach

**I am your tutor** - this is a learning project. I take the lead on:
- Deciding what to teach and when
- Structuring learning progression (simple → complex)
- Choosing which features to implement next
- Introducing concepts at the right time

The user learns by doing, with technical explanations of how things work.

---

## Workflow Instructions

### 1. Feature Tutorial System
- When introducing new React Native/React features, create **technical, implementation-focused explanations**
- Include actual usage examples and how the feature works under the hood
- For each new framework feature, create a **demo screen/component** the user can interact with and experiment
- Focus on understanding internals and implementation details, not just basic usage

### 2. Command Summary
- After each command execution, provide a comprehensive list of all changes made
- Include:
  - Files created/modified/deleted
  - Commands run
  - Features implemented
  - Any configuration changes

### 3. Documentation Updates
- Update this Claude.md file when new project-specific instructions emerge
- Keep project description current (both business and technical context)
- Document key decisions and architectural choices

### 4. Intelligent Usage
- Use these guidelines as a framework, not rigid rules
- Apply common sense and prioritize user needs
- Adapt workflow based on context and user feedback

### 5. Git Workflow
- Commit the previous command's changes once the user confirms them in the next command
- Write clear, descriptive commit messages
- Keep commits atomic and focused
- **Commit message style**: Short summary format
  - Example: "Add login functionality and API service layer with placeholder values"
  - Avoid verbose multi-line descriptions unless necessary

### 6. Clarification First
- Always ask questions if anything is unclear before making changes
- Confirm architectural decisions
- Verify understanding of requirements

### 7. Communication Style
- **For quick questions during learning:** Keep answers concise and simple
- **No need for new tutorials** unless explicitly requested or a major new concept
- Match the complexity of the answer to the complexity of the question
- Review these guidelines at the start of each request

---

## Project Overview

### Business Context
**Egg9** is an egg selling platform that connects egg producers with customers.

**Customer Features:**
- Browse available eggs and current stock
- One-time purchase option
- Weekly subscription service (recurring egg delivery)
- View order history
- Manage subscriptions

**Owner/Admin Features:**
- Update weekly available egg stock
- Accept or decline purchase orders
- Manage inventory automatically based on orders
- View all orders and subscriptions
- Customer management

### Technical Context
**Architecture:**
- **Frontend**: React Native with Expo (this project)
  - Supports iOS, Android, and Web from a single codebase
  - Handles user interface and client-side logic
- **Backend**: Laravel API (separate project)
  - Handles authentication, data persistence, business logic
  - RESTful API endpoints for frontend consumption

**Technology Stack:**
- **React Native** - Cross-platform mobile framework
- **Expo** - Development framework and tooling for React Native
- **Expo Router** - File-based navigation system
- **React Native Web** - Web platform support
- **React Native Paper** - Material Design component library
- **TypeScript** - Static typing for improved code quality
- **AsyncStorage** - Local data persistence (temporary, before backend)
- **Backend**: Laravel API (separate repository, not yet implemented)

### Key Features
- Multi-platform support (iOS, Android, Web)
- User authentication
- Product browsing and ordering
- Subscription management
- Inventory management (admin)
- Order processing workflow

---

## Development Notes

### Current Phase
🎨 UI Modernized with React Native Paper!
Fully functional app with modern Material Design 3 interface

### Completed Steps
1. ✅ Verified Node.js v20.19.4 and npm v10.8.2
2. ✅ Created foundational tutorials (JavaScript ecosystem, React Native, Expo)
3. ✅ Initialized Expo project with Router and tabs template
4. ✅ Created project structure tutorials (TypeScript, running app)
5. ✅ Started Expo dev server
6. ✅ Implemented authentication system with login screen
7. ✅ Created API service layer with mock data (ready for backend)
8. ✅ Built core features:
   - User authentication (3 test users + 1 admin)
   - Weekly stock management
   - One-time orders
   - Weekly subscriptions (regular pricing, no discount)
   - Multi-user support with shared stock
   - Admin panel for stock, delivery, and order management
9. ✅ Modernized UI with React Native Paper
   - Custom Material Design 3 theme
   - Modern, professional components across all screens
   - Consistent styling and typography
   - Enhanced accessibility

### Business Logic Implemented
- **Weekly Stock System**: Owner sets available eggs each week
- **One-Time Orders**: Customers order from current week's stock
- **Subscriptions**: Recurring weekly orders with configurable duration
  - Quantity: Max 30 eggs/week
  - Duration: 4-12 weeks (minimum 4 weeks, maximum 3 months)
  - Regular pricing (no discount)
- **Increments**: All orders in multiples of 10 eggs ("dozen" = 10 eggs)
- **Multi-User**: Shared global stock, user-specific orders/subscriptions
- **Admin Features**: Stock management, delivery scheduling, order tracking
- **Delivery Status**: Track order delivery with admin controls

### Next Steps
1. ✅ Backend is COMPLETE (87 tests passing, all 21 endpoints working!)
2. 🔄 Currently integrating real API (replacing mock implementations)
3. Test all features with real backend
4. Polish UI/UX based on real data
5. Deploy to production

### Development Server
- Status: Running in background
- URL: http://localhost:8081
- Log file: expo-dev.log
- Stop: `ps aux | grep "expo start" | grep -v grep | awk '{print $2}' | xargs kill`

---

### UI/UX Design
**React Native Paper (Material Design 3):**
- Custom theme with brand colors (Orange primary, Cyan secondary, Green success)
- Consistent typography using Material Design type scale
- Elevated cards and surfaces for content hierarchy
- Modern input fields with floating labels and icons
- Professional data tables for admin panel
- Snackbars for user feedback
- Chips and badges for status indicators
- Responsive design that adapts to iOS, Android, and Web

**Test Credentials:**
- Admin: admin@egg9.com / password123
- User 1: user1@egg9.com / password123
- User 2: user2@egg9.com / password123

---

*Last Updated: November 19, 2025*

