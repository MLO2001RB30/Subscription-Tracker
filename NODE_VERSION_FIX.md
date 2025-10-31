# Node.js Version Compatibility Fix

## The Problem

Your system is running **Node.js v22.21.1**, which has experimental TypeScript features enabled by default. These features conflict with Expo SDK 53's `expo-modules-core` package.

**Error:**
```
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts"
for /node_modules/expo-modules-core/src/index.ts
```

## The Solution

Expo SDK 53 is **officially compatible with Node.js 18 LTS and Node.js 20 LTS only**. Node v22 is too new and not yet supported.

---

## Option 1: Use NVM (Recommended)

### Install NVM
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
```

Close and reopen your terminal, then:

### Install Node 20
```bash
nvm install 20
nvm use 20
node --version  # Should show v20.x.x
```

### Run the App
```bash
cd SubTrackDK
npm install  # Reinstall with correct Node version
npx expo start
```

---

## Option 2: Use Docker

If you can't change your Node version, run the app in a Docker container:

### Create Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install Expo CLI globally
RUN npm install -g @expo/cli

# Copy package files
COPY SubTrackDK/package*.json ./

# Install dependencies
RUN npm install

# Copy app files
COPY SubTrackDK/. .

# Expose Expo ports
EXPOSE 8081 19000 19001 19002

CMD ["npx", "expo", "start"]
```

### Run with Docker
```bash
# Build image
docker build -t subtrack .

# Run container
docker run -it -p 19000:19000 -p 19001:19001 -v $(pwd)/SubTrackDK:/app subtrack
```

---

## Option 3: Downgrade Node Manually

### On macOS (with Homebrew)
```bash
brew install node@20
brew unlink node
brew link node@20
```

### On Ubuntu/Debian
```bash
# Remove current Node
sudo apt remove nodejs

# Install Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
```

### On Windows
1. Download Node 20 LTS from https://nodejs.org/
2. Run the installer
3. Verify with `node --version` in Command Prompt

---

## Option 4: Use Volta (Alternative to NVM)

```bash
# Install Volta
curl https://get.volta.sh | bash

# Install Node 20
volta install node@20

# Verify
node --version
```

---

## After Installing Node 20

### 1. Clean and Reinstall
```bash
cd SubTrackDK
rm -rf node_modules package-lock.json
npm install
```

### 2. Start Expo
```bash
npx expo start
```

### 3. Open in Expo Go
- Scan the QR code with your phone
- The app should now start successfully!

---

## Why This Happens

### Node v22 Experimental Features
Node.js v22 introduced experimental TypeScript support that automatically strips types from `.ts` files during import. However, this feature:

1. Only works for files **outside** `node_modules`
2. Conflicts with how Expo's bundler (Metro) handles TypeScript
3. Causes `expo-modules-core` (which uses `main: "src/index.ts"`) to fail

### Expo's Requirements
Expo SDK 53 was released before Node v22 and is designed for:
- Node.js 18 LTS (recommended)
- Node.js 20 LTS (supported)

---

## Verify Your Setup

### Check Node Version
```bash
node --version
```

**Should show:** `v18.x.x` or `v20.x.x`

### Check Expo Works
```bash
cd SubTrackDK
npx expo --version
```

**Should show:** `0.24.x` or higher

### Test Startup
```bash
npx expo start
```

**Should show:**
```
Starting Metro Bundler
› Metro waiting on exp://...
› Scan the QR code above with Expo Go
```

---

## Still Not Working?

### Clear All Caches
```bash
cd SubTrackDK

# Clear npm cache
npm cache clean --force

# Clear Expo cache
npx expo start --clear

# Clear watchman (if installed)
watchman watch-del-all

# Reinstall everything
rm -rf node_modules package-lock.json
npm install
```

### Check for Conflicting Node Installations
```bash
which node
which npm
which npx
```

All should point to the same Node version (20.x).

### Use Specific npx Version
```bash
npx --version
node --version  # Should match
```

---

## Alternative: Upgrade to Expo SDK 54 (Not Recommended Yet)

Expo SDK 54 is in beta and may have better Node v22 support, but it's not stable:

```bash
cd SubTrackDK
npx expo install expo@~54.0.0
npm install
```

**Warning:** This may break existing code. Only try if you're comfortable debugging.

---

## Recommended Path Forward

1. ✅ Install NVM (takes 2 minutes)
2. ✅ Install Node 20 with NVM
3. ✅ Reinstall dependencies
4. ✅ Run `npx expo start`
5. ✅ Scan QR code with Expo Go

**Total time:** 5-10 minutes

---

## Quick Commands (Copy & Paste)

### Complete Fix with NVM
```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash

# Restart terminal, then:
nvm install 20
nvm use 20

# Navigate to app and reinstall
cd SubTrackDK
rm -rf node_modules package-lock.json
npm install

# Start app
npx expo start
```

---

## Project Scripts (Updated)

The `package.json` has been updated with NODE_OPTIONS flags, but **these don't work with Node v22** due to the ESM/TypeScript conflict.

**Current scripts (won't work on Node v22):**
```json
{
  "scripts": {
    "start": "NODE_OPTIONS='--no-experimental-strip-types' expo start",
    "android": "NODE_OPTIONS='--no-experimental-strip-types' expo start --android",
    "ios": "NODE_OPTIONS='--no-experimental-strip-types' expo start --ios"
  }
}
```

**With Node v20, you can use simple scripts:**
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios"
  }
}
```

---

## Summary

**Problem:** Node v22 is incompatible with Expo SDK 53
**Solution:** Use Node v18 or v20
**Recommended Tool:** NVM for easy Node version management
**Time to Fix:** 5-10 minutes

After switching to Node 20, the app will start successfully!
