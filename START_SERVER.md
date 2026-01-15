# 🚀 How to Start the Development Server

## Problem
You're using Node.js v16.20.2, but Next.js 14 requires Node.js >= v18.17.0

## Solution

### Option 1: Use the Script (Easiest)
```bash
cd /Users/snehacharya/Desktop/NepNetflix
./start-dev.sh
```

### Option 2: Manual Steps
```bash
# 1. Switch to Node 18
nvm use 18

# 2. Verify Node version
node --version  # Should show v18.x.x

# 3. Start the server
npm run dev
```

### Option 3: If nvm doesn't work
```bash
# Install Node 18 if not installed
nvm install 18

# Then use it
nvm use 18
npm run dev
```

---

**Once running, open:** http://localhost:3000
