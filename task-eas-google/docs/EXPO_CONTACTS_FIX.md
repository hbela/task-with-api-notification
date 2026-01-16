# ExpoContacts Module Not Found - Solution

## Problem
You're seeing: `Cannot find native module 'ExpoContacts'`

This happens because:
1. You built the app with EAS (which has expo-contacts native module)
2. You're now using Metro dev server (`npx expo start --dev-client`)
3. Metro is reloading JavaScript but the native module isn't available in the Metro environment

## Solution

### Option 1: Restart the App (Recommended)
**Don't use Metro's reload.** Instead:

1. **Close the app completely** on your device
2. **Reopen the app** from the device's app launcher
3. The app will connect to Metro but use the native modules from the EAS build

### Option 2: Rebuild with Local Build
If you need to develop with hot reload:

```bash
# Stop Metro
# Then rebuild locally
npx expo run:android
```

This will:
- Build the app with native modules on your machine
- Start Metro automatically
- Enable hot reload with native modules

## Why This Happens

**EAS Build (Production-like)**:
- ✅ Native modules compiled and linked
- ✅ expo-contacts works
- ❌ Slower build process

**Metro Dev Server (Development)**:
- ✅ Fast JavaScript reload
- ❌ Can't reload native modules
- ❌ Needs local native build

## Current Situation

You have:
- ✅ EAS build installed (has expo-contacts native module)
- ✅ Metro running (serving JavaScript)
- ❌ Metro trying to reload causes native module error

## Quick Fix

**Just restart the app!**

1. Force close the app on your device
2. Open it again from the launcher
3. It will connect to Metro
4. JavaScript changes will hot reload
5. Native modules will work

## Long-term Solution

For active development with native modules:

```bash
# Build locally once
npx expo run:android

# This gives you:
# - Native modules working
# - Hot reload working
# - Faster iteration
```

## Verification

After restarting the app, you should see:
- ✅ App loads without errors
- ✅ Can create tasks
- ✅ Contact search button appears
- ✅ Can search device contacts
- ✅ No "Cannot find native module" errors

---

**Current Status**: EAS build is good, just need to restart the app instead of using Metro reload.
