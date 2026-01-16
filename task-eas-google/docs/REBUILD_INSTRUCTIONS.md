# Rebuild Instructions for Expo Contacts

## The Issue
The error "Cannot find native module 'ExpoContacts'" means the native module needs to be compiled into the app.

## Solution: Rebuild the App

### Option 1: Using Expo Development Build (Recommended)

```bash
# Stop the current Metro bundler (Ctrl+C)

# For Android
npx expo run:android

# For iOS
npx expo run:ios
```

This will:
1. Install the native module
2. Rebuild the app with the new module
3. Start the app on your device/emulator

### Option 2: Using EAS Build (For Production)

```bash
# Build for Android
eas build --platform android --profile development

# Build for iOS
eas build --platform ios --profile development
```

### Option 3: Prebuild (Alternative)

```bash
# Generate native code
npx expo prebuild --clean

# Then run
npx expo run:android
# or
npx expo run:ios
```

## After Rebuild

Once the app rebuilds successfully:
1. The ExpoContacts module will be available
2. Contact sync features will work
3. You can test the contact management feature

## Quick Fix for Development

If you want to test other features without contacts for now, you can temporarily disable the contact sync:

1. Comment out the ContactSyncManager usage in the contact detail screen
2. The rest of the app will work, but device sync won't happen

## Verification

After rebuilding, you should see:
- ✅ No "Cannot find native module" error
- ✅ App starts successfully
- ✅ Contacts tab is accessible
- ✅ Contact permissions can be requested

---

**Note**: Every time you add a new native module (like expo-contacts), you need to rebuild the app. This is a one-time step for this module.
