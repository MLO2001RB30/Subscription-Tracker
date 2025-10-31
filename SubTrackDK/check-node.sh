#!/bin/bash

echo "======================================"
echo "  SubTrack DK - Node Version Checker"
echo "======================================"
echo ""

# Get Node version
NODE_VERSION=$(node --version)
echo "Current Node version: $NODE_VERSION"

# Extract major version number
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')

echo ""

# Check if Node version is compatible
if [ "$NODE_MAJOR" -eq 18 ] || [ "$NODE_MAJOR" -eq 20 ]; then
    echo "✅ COMPATIBLE: Node $NODE_MAJOR is supported by Expo SDK 53"
    echo ""
    echo "You can now run:"
    echo "  npm install"
    echo "  npx expo start"
    exit 0
elif [ "$NODE_MAJOR" -lt 18 ]; then
    echo "❌ TOO OLD: Node $NODE_MAJOR is not supported"
    echo ""
    echo "Please upgrade to Node 18 or Node 20:"
    echo "  nvm install 20"
    echo "  nvm use 20"
    exit 1
else
    echo "❌ TOO NEW: Node $NODE_MAJOR is not compatible with Expo SDK 53"
    echo ""
    echo "Expo SDK 53 requires Node 18 LTS or Node 20 LTS."
    echo ""
    echo "To fix this, install Node 20:"
    echo ""
    echo "  # Install NVM (if not installed)"
    echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash"
    echo ""
    echo "  # Restart terminal, then:"
    echo "  nvm install 20"
    echo "  nvm use 20"
    echo ""
    echo "Then reinstall dependencies:"
    echo "  cd SubTrackDK"
    echo "  rm -rf node_modules package-lock.json"
    echo "  npm install"
    echo ""
    echo "For more details, see: NODE_VERSION_FIX.md"
    exit 1
fi
