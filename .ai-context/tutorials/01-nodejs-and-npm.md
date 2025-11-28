# Tutorial 1: Node.js and npm

## What is Node.js?

**Node.js** is a JavaScript runtime environment that lets you run JavaScript code outside of a web browser. 

### Key Points:
- **JavaScript was originally built for browsers only** (to add interactivity to websites)
- **Node.js brought JavaScript to servers and desktop applications**
- It's built on Chrome's V8 JavaScript engine (super fast!)
- You can build servers, command-line tools, and mobile apps with it

### Think of it this way:
- Browser JavaScript: Can manipulate web pages, handle clicks, etc.
- Node.js JavaScript: Can read/write files, run servers, access databases, etc.

---

## What is npm?

**npm** stands for **N**ode **P**ackage **M**anager.

### What does it do?
1. **Package Manager**: Installs and manages libraries (called "packages") that other developers have created
2. **Dependency Management**: Keeps track of which packages your project needs
3. **Script Runner**: Can run commands/scripts for your project

### Key Files:
- **package.json**: Lists your project's dependencies and scripts
- **package-lock.json**: Locks exact versions of dependencies (ensures everyone gets the same versions)
- **node_modules/**: Folder where npm installs all the packages

---

## Common npm Commands

```bash
# Initialize a new project (creates package.json)
npm init

# Install a package for your project
npm install <package-name>

# Install a package globally (available system-wide)
npm install -g <package-name>

# Install all dependencies listed in package.json
npm install

# Run a script defined in package.json
npm run <script-name>

# Start your app (shortcut for npm run start)
npm start
```

---

## What is nvm?

**nvm** (Node Version Manager) lets you install and switch between different versions of Node.js.

### Why do we need this?
- Different projects might need different Node.js versions
- Easy to test your code with different versions
- Safe to upgrade without breaking old projects

### Common nvm Commands:

```bash
# List installed Node versions
nvm ls

# Install a specific version
nvm install 20.19.4

# Use a specific version
nvm use 20.19.4

# Install and use the latest LTS (Long Term Support) version
nvm install --lts
```

---

## For Egg9 Project:

We're using:
- **Node.js v20.19.4** (Latest LTS version - stable and recommended for production)
- **npm v10.8.2** (Comes with Node.js)

This gives us access to the latest features while maintaining stability! 🚀

