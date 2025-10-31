# Node Version Enforcement - Implementation Summary

## What Was Added

### 1. Automated Version Check Script
**File:** `scripts/check-node.js`
- Validates Node.js version is 18.x or 20.x
- Exits with clear error message on unsupported versions
- Executable script that runs before install/start

### 2. NVM Configuration
**File:** `.nvmrc`
- Specifies Node 20 as the default version
- Enables automatic version switching with `nvm use`
- Works with NVM and Volta

### 3. Package.json Updates
**Changes:**
```json
{
  "scripts": {
    "preinstall": "node scripts/check-node.js",  // NEW: Runs before npm install
    "prestart": "node scripts/check-node.js"      // NEW: Runs before npm start
  },
  "engines": {
    "node": ">=18 <21"  // NEW: Documents supported Node versions
  }
}
```

### 4. Documentation Updates
**Files Updated:**
- `NODE_VERSION_FIX.md` - Added automated check section
- `README.md` - Added prerequisites and version requirements

## How It Works

### Before (Node 22 causes cryptic Metro error)
```bash
$ npm start
Starting Metro Bundler...
TypeError: createJob(...).run is not a function
    at /node_modules/metro/src/...
```

### After (Clear error message)
```bash
$ npm install

SubTrackDK requires Node.js 18 LTS or 20 LTS.
You are running Node.js v22.21.1.
Please switch to a supported Node version before continuing.
See NODE_VERSION_FIX.md for detailed instructions.
```

## Developer Workflow

### First Time Setup
```bash
# Switch to Node 20
nvm install 20
cd SubTrackDK
nvm use  # Reads .nvmrc automatically

# Install dependencies (check passes)
npm install

# Start app (check passes)
npm start
```

### Daily Development
```bash
cd SubTrackDK
nvm use  # Quick version switch

npm start  # Check runs automatically
```

## Benefits

1. **Prevents confusing errors** - No more Metro bundler crashes
2. **Clear guidance** - Points developers to NODE_VERSION_FIX.md
3. **Automatic enforcement** - Can't accidentally use wrong Node version
4. **Zero runtime impact** - Checks run only during install/start
5. **IDE friendly** - `.nvmrc` enables automatic version switching

## Files Added/Modified

### New Files
- `scripts/check-node.js` (executable)
- `.nvmrc`
- `CHANGES.md` (this file)

### Modified Files
- `package.json` (added engines, preinstall, prestart)
- `NODE_VERSION_FIX.md` (documented automated checks)
- `README.md` (added prerequisites section)

## Testing

The check was tested with Node 22.21.1:
```bash
$ node scripts/check-node.js

SubTrackDK requires Node.js 18 LTS or 20 LTS.
You are running Node.js v22.21.1.
Please switch to a supported Node version before continuing.
See NODE_VERSION_FIX.md for detailed instructions.

$ echo $?
1  # Exit code 1 (failure)
```

## Rollback Instructions

If needed, revert by:
1. Remove `scripts/check-node.js`
2. Remove `.nvmrc`
3. Remove `"preinstall"` and `"prestart"` from package.json
4. Remove `"engines"` field from package.json
