# Building New EAS Dev Client with DateTimePicker

## Issue
The `@react-native-community/datetimepicker` package requires native code that must be compiled into your app. Your current dev client was built before this package was added, so the native module `RNCDatePicker` is not available.

## Temporary Solution (Current)
The app has been updated to gracefully handle the missing native module:
- ✅ Priority selector works (no native code required)
- ⚠️ Date/Time picker shows a warning message instead of crashing
- ✅ All other features work normally
- ✅ You can still create/edit tasks with priority (just not due dates yet)

## Permanent Solution: Build New Dev Client with EAS

### Step 1: Check EAS Configuration
Make sure your `eas.json` is properly configured:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

### Step 2: Build New Development Client

For Android:
```bash
eas build --profile development --platform android
```

For iOS:
```bash
eas build --profile development --platform ios
```

### Step 3: Install the New Build
Once the build completes:
1. EAS will provide a download link
2. Install the new dev client on your device
3. The new build will include the DateTimePicker native module

### Step 4: Test
After installing the new dev client:
1. Start your dev server: `npm start`
2. Scan the QR code with the new dev client
3. The date/time picker should now work!

## What's Included in the New Build
- ✅ All existing native modules
- ✅ `@react-native-community/datetimepicker` (v8.4.4)
- ✅ Google Sign-In
- ✅ Expo Notifications
- ✅ Expo Secure Store

## Alternative: Use Expo Go (Limited)
**Note**: Expo Go does NOT support custom native modules like `@react-native-community/datetimepicker`. You must use a custom dev client built with EAS.

## Files Modified for Graceful Degradation
- `components/TaskForm.tsx` - Added conditional import and fallback UI
- Shows warning message when native module is not available
- Prevents app crash while waiting for new dev build

## Current App Status
✅ **Working Features**:
- Task list with priority badges
- Create/edit tasks with priority
- Task details with priority display
- All authentication features
- All existing functionality

⚠️ **Pending New Dev Build**:
- Date/Time picker (shows warning instead)

## Next Steps
1. Run `eas build --profile development --platform android` (or ios)
2. Wait for build to complete (~10-20 minutes)
3. Install the new dev client
4. Enjoy full date/time picker functionality! 🎉
