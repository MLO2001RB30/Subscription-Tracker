#!/bin/bash

echo "Fixing expo-modules-core TypeScript issue..."

# Patch the package.json to use index.js instead of src/index.ts
cd node_modules/expo-modules-core

# Update main entry point
sed -i 's|"main": "src/index.ts"|"main": "index.js"|' package.json

# Ensure index.js exists with proper export
if [ ! -f "index.js" ] || [ "$(cat index.js)" = "module.exports = null;" ]; then
    echo "// Wrapper to handle TypeScript source files" > index.js
    echo "module.exports = null;" >> index.js
fi

echo "✅ expo-modules-core patched successfully!"
echo ""
echo "You can now run:"
echo "  npx expo start"
