# QA Setup Guide - Egg9 Project

A complete beginner's guide to setting up the Egg9 project locally for testing.

## Table of Contents
1. [What You'll Need](#what-youll-need)
2. [Installing Prerequisites](#installing-prerequisites)
3. [Getting the Code](#getting-the-code)
4. [Setting Up the Backend](#setting-up-the-backend)
5. [Setting Up the Frontend](#setting-up-the-frontend)
6. [Running the Application](#running-the-application)
7. [Testing Tips](#testing-tips)
8. [Troubleshooting](#troubleshooting)

---

## What You'll Need

Before starting, you'll need to install these tools on your computer:

| Tool | What it does |
|------|-------------|
| **Git** | Downloads code from GitHub |
| **Docker Desktop** | Runs the backend server in a container |
| **Node.js** | Runs the frontend application |
| **VS Code** (optional) | Code editor for viewing files |

---

## Installing Prerequisites

### Step 1: Install Git

**Windows:**
1. Go to https://git-scm.com/download/win
2. Download and run the installer
3. Click "Next" through all options (defaults are fine)
4. Restart your terminal/computer after installation

**Mac:**
```bash
# Open Terminal and run:
xcode-select --install
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install git
```

**Verify installation:**
```bash
git --version
# Should show something like: git version 2.40.0
```

---

### Step 2: Install Docker Desktop

1. Go to https://www.docker.com/products/docker-desktop/
2. Download Docker Desktop for your operating system
3. Run the installer
4. **Important:** After installation, open Docker Desktop and wait for it to start (you'll see a green "Running" status)

**Verify installation:**
```bash
docker --version
# Should show something like: Docker version 24.0.0

docker-compose --version
# Should show something like: Docker Compose version v2.20.0
```

> ⚠️ **Docker Desktop must be running** whenever you want to start the backend!

---

### Step 3: Install Node.js

1. Go to https://nodejs.org/
2. Download the **LTS** version (Long Term Support)
3. Run the installer
4. Click "Next" through all options

**Verify installation:**
```bash
node --version
# Should show something like: v20.10.0

npm --version
# Should show something like: 10.2.0
```

---

## Getting the Code

### Step 1: Create a folder for the project

```bash
# Windows (in Command Prompt or PowerShell)
mkdir C:\Projects
cd C:\Projects

# Mac/Linux (in Terminal)
mkdir ~/Projects
cd ~/Projects
```

### Step 2: Clone the repositories

You need to download both the frontend and backend:

```bash
# Clone the frontend
git clone https://github.com/Kozmo2854/Egg9_Frontend.git

# Clone the backend
git clone https://github.com/Kozmo2854/Egg9_Backend.git
```

### Step 3: Switch to the test branch

```bash
# Switch frontend to test branch
cd Egg9_Frontend
git checkout test
cd ..

# Switch backend to test branch
cd Egg9_Backend
git checkout test
cd ..
```

Your folder structure should now look like:
```
Projects/
├── Egg9_Frontend/
└── Egg9_Backend/
```

---

## Setting Up the Backend

### Step 1: Navigate to the backend folder

```bash
cd Egg9_Backend
```

### Step 2: Create the environment file

The backend needs a configuration file. Copy the example:

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

### Step 3: Start the backend with Docker

Make sure Docker Desktop is running, then:

```bash
docker-compose up -d
```

**What this does:**
- Downloads necessary images (first time only, takes a few minutes)
- Starts the database (MySQL)
- Starts the PHP server
- The `-d` flag runs it in the background

**Verify it's running:**
```bash
docker-compose ps
```
You should see containers with "Up" status.

### Step 4: Set up the database

Run these commands to set up the database tables and sample data:

```bash
# Run database migrations (creates tables)
docker-compose exec app php artisan migrate

# Seed the database with test data
docker-compose exec app php artisan db:seed
```

### Step 5: Verify the backend is working

Open your browser and go to:
```
http://localhost:8000/api/health
```

You should see a JSON response like:
```json
{"status": "ok"}
```

---

## Setting Up the Frontend

### Step 1: Navigate to the frontend folder

```bash
cd ../Egg9_Frontend
# or if you're in Projects folder:
cd Egg9_Frontend
```

### Step 2: Install dependencies

```bash
npm install
```

This downloads all the required packages. It may take a few minutes.

### Step 3: Create the environment file

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

### Step 4: Configure the backend URL

Open the `.env` file in a text editor and make sure it has:

```
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_APP_ENV=development
```

---

## Running the Application

### Start the backend (if not already running)

```bash
cd Egg9_Backend
docker-compose up -d
```

### Start the frontend

```bash
cd Egg9_Frontend
npm start
```

This will show you options:
- Press `w` to open in web browser
- Press `a` to open on Android (requires emulator/device)
- Press `i` to open on iOS (Mac only, requires simulator)

### Access the app

**Web:** Open http://localhost:8081 in your browser

### Test Credentials

After seeding the database, you can log in with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@egg9.com | password |
| User | user@egg9.com | password |

---

## Testing Tips

### Useful Test Scenarios

1. **User Registration**
   - Create a new account
   - Verify email validation
   - Check password requirements

2. **Order Flow**
   - Log in as a user
   - Place a one-time order
   - Mark order as paid
   - View order in history

3. **Subscription Flow**
   - Create a subscription
   - Verify subscription appears on home screen
   - Cancel subscription

4. **Admin Functions**
   - Log in as admin
   - Set weekly stock
   - Confirm deliveries
   - Confirm payments

### How to Reset the Database

If you want to start fresh:

```bash
cd Egg9_Backend
docker-compose exec app php artisan migrate:fresh --seed
```

This will delete all data and re-create the test data.

### Viewing the Database

If you want to see the actual data, install a database tool like:
- **DBeaver** (free): https://dbeaver.io/download/

Connection details:
- Host: `localhost`
- Port: `3306`
- Database: `egg9`
- Username: `root`
- Password: `root`

---

## Troubleshooting

### "Docker is not running"

Make sure Docker Desktop is open and shows "Running" status.

### "Port 8000 is already in use"

Another application is using port 8000. Either:
1. Close the other application
2. Or change the port in `docker-compose.yml`

### "npm command not found"

Node.js isn't installed properly. Reinstall it from https://nodejs.org/

### "Cannot connect to backend"

1. Make sure Docker containers are running: `docker-compose ps`
2. Check the backend URL in frontend `.env` file
3. Try accessing http://localhost:8000/api/health in browser

### "git checkout test" fails

The branch might not exist locally yet. Try:
```bash
git fetch origin
git checkout test
```

### Frontend shows blank screen

1. Check browser console for errors (F12 → Console tab)
2. Make sure backend is running
3. Check `.env` has correct API URL

---

## Stopping the Application

### Stop the frontend
Press `Ctrl + C` in the terminal running `npm start`

### Stop the backend
```bash
cd Egg9_Backend
docker-compose down
```

---

## Updating the Code

When new changes are pushed to the test branch:

```bash
# Update frontend
cd Egg9_Frontend
git pull

# Update backend
cd ../Egg9_Backend
git pull

# If there are database changes, run migrations
docker-compose exec app php artisan migrate
```

---

## Need Help?

If you encounter issues not covered here, contact the development team with:
1. The exact error message
2. What command you ran
3. What step you were on

Happy testing! 🥚

