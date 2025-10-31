#!/bin/bash

# Disable Node.js experimental TypeScript features that conflict with Expo
export NODE_OPTIONS="--no-experimental-strip-types --no-experimental-detect-module"

# Alternative: Use Node v20 if available
if command -v node20 &> /dev/null; then
    echo "Using Node 20..."
    node20 $(which npx) expo start "$@"
elif command -v nvm &> /dev/null; then
    echo "Using nvm to run Node 20..."
    nvm exec 20 npx expo start "$@"
else
    echo "Using current Node with compatibility flags..."
    npx expo start "$@"
fi
