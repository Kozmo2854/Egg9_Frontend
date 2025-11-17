# Claude AI Assistant - Project Guidelines

## Workflow Instructions

### 1. Feature Tutorial System
- Whenever a new React Native or React feature is used in the code, create a dedicated tutorial file in the `tutorials/` folder
- Each tutorial should be short, focused, and beginner-friendly
- Tutorials should explain the "what", "why", and "how" of each feature

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
- **TypeScript** (optional, can be added later)
- **Backend**: Laravel API (separate repository)

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
✅ Project initialized and running!
Learning React Native basics and making first changes

### Completed Steps
1. ✅ Verified Node.js v20.19.4 and npm v10.8.2
2. ✅ Created foundational tutorials (JavaScript ecosystem, React Native, Expo)
3. ✅ Initialized Expo project with Router and tabs template
4. ✅ Created project structure tutorials (TypeScript, running app)
5. ✅ Started Expo dev server (running on http://localhost:8081)

### Next Steps
1. View the app in browser and understand the code structure
2. Make first code changes and see Fast Refresh in action
3. Learn about React Native components and styling
4. Create initial app screens for Egg9
5. Implement authentication UI
6. Connect to Laravel backend API

### Development Server
- Status: Running in background
- URL: http://localhost:8081
- Log file: expo-dev.log
- Stop: `ps aux | grep "expo start" | grep -v grep | awk '{print $2}' | xargs kill`

---

*Last Updated: November 17, 2025*

