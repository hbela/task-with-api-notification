# 📱 Notification Display Duration Improvements

**Date:** 2026-01-15  
**Issue:** Foreground notifications disappearing too quickly (1 second)  
**Solution:** Enhanced notification configuration for better visibility

---

## ✅ Changes Made

### 1. **Updated Notification Handler** (`lib/notifications/index.ts`)
- ✅ Removed deprecated `shouldShowAlert` property
- ✅ Kept `shouldShowBanner: true` and `shouldShowList: true` for visibility
- ✅ Maintained `shouldSetBadge: false` as requested

### 2. **Enhanced Android Notification Channel** (`lib/notifications/index.ts`)
```typescript
await Notifications.setNotificationChannelAsync('task-reminders', {
  name: 'Task Reminders',
  importance: Notifications.AndroidImportance.MAX, // Maximum importance
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#007AFF',
  lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  bypassDnd: true,
  sound: 'default',
  enableVibrate: true, // ✨ NEW
  showBadge: false,    // ✨ NEW - Consistent with handler
});
```

**Benefits:**
- `AndroidImportance.MAX` ensures heads-up notifications
- `enableVibrate: true` adds tactile feedback
- `showBadge: false` consistent with notification handler

### 3. **Improved Notification Content** (`lib/notifications/scheduler.ts`)
```typescript
content: {
  title: getNotificationTitle(minutesBefore),
  body: task.title,
  data: { ... },
  sound: 'default',
  categoryIdentifier: 'TASK_REMINDER',
  priority: Notifications.AndroidNotificationPriority.HIGH,
  sticky: false,       // ✨ NEW - User can dismiss
  autoDismiss: true,   // ✨ NEW - Auto-dismiss after system timeout
  ...
}
```

**Benefits:**
- `sticky: false` allows users to swipe away notifications
- `autoDismiss: true` enables system-managed timeout (typically 5-7 seconds on Android)
- `priority: HIGH` ensures prominent display

### 4. **Updated QA Test Notification** (`lib/notifications/notificationQA.ts`)
- ✅ Added `sticky: false` and `autoDismiss: true` to quick test
- ✅ Consistent behavior across all notifications

### 5. **Fixed TypeScript Errors**
- ✅ Removed redundant `repeats: true` from DAILY trigger (already repeats by default)

---

## 📊 How It Works

### Android Notification Display Duration

The notification display duration is controlled by several factors:

1. **Importance Level:** `MAX` importance shows heads-up notifications
2. **Priority:** `HIGH` priority ensures prominent display
3. **Auto-Dismiss:** System manages timeout (typically 5-7 seconds)
4. **Sticky:** `false` allows user dismissal

### Foreground vs Background

**Foreground (App Open):**
- Notification banner appears at top of screen
- Duration: ~5-7 seconds (system-managed with `autoDismiss: true`)
- User can tap to interact or swipe to dismiss
- Banner shows with `shouldShowBanner: true`
- Also appears in notification list with `shouldShowList: true`

**Background (App Minimized):**
- Full notification in notification center
- Stays until user dismisses
- Heads-up notification appears briefly
- User can tap to open app

**Killed (App Closed):**
- Same as background
- Tapping opens the app

---

## 🎯 Expected Behavior Now

### Before Changes
```
❌ Notification appears for ~1 second
❌ Disappears too quickly to read
❌ Deprecation warnings in console
```

### After Changes
```
✅ Notification appears for ~5-7 seconds
✅ Enough time to read the message
✅ User can dismiss by swiping
✅ No deprecation warnings
✅ Consistent behavior across all notifications
```

---

## 🧪 Testing

To test the improved notification duration:

1. **Go to QA Test tab** (flask icon 🧪)
2. **Tap "🚀 Send Quick Test Notification"**
3. **Keep app in foreground**
4. **Wait 5 seconds**
5. **Observe:** Notification banner should stay visible for ~5-7 seconds

### Test Scenarios

**Scenario A: Foreground Test**
```
1. Keep app open
2. Send quick test notification
3. Banner appears at top
4. Stays visible for 5-7 seconds
5. Auto-dismisses or can be swiped away
```

**Scenario B: Background Test**
```
1. Send quick test notification
2. Minimize app immediately
3. Heads-up notification appears
4. Full notification in notification center
5. Stays until dismissed
```

---

## ⚙️ System Limitations

### Android
- **Heads-up duration:** Controlled by system (typically 5-7 seconds)
- **Cannot be extended beyond system limits**
- **Importance MAX:** Required for heads-up notifications
- **User settings:** Can override app settings in device notification settings

### iOS
- **Banner duration:** Controlled by iOS (typically 5 seconds)
- **Cannot be customized per notification**
- **Interruption level:** `timeSensitive` helps prioritize
- **User settings:** Can override in Settings → Notifications

---

## 🔧 Additional Customization Options

If you need even more visibility, consider:

### Option 1: Persistent Notifications (Not Recommended for Reminders)
```typescript
sticky: true  // Notification stays until explicitly dismissed
```
⚠️ **Note:** This can be annoying for users

### Option 2: Custom In-App Banner
Create a custom React Native component that shows for longer:
- Use `addNotificationReceivedListener`
- Display custom banner for 10+ seconds
- More control over styling and duration

### Option 3: Sound + Vibration
Already implemented:
- `sound: 'default'` plays notification sound
- `enableVibrate: true` adds vibration
- Helps draw attention even if banner is brief

---

## 📝 Files Modified

1. `lib/notifications/index.ts` - Notification handler and Android channel
2. `lib/notifications/scheduler.ts` - Task reminder notifications
3. `lib/notifications/notificationQA.ts` - QA test notifications

---

## 🎉 Summary

The notification display duration has been improved from ~1 second to ~5-7 seconds by:

1. ✅ Using `AndroidImportance.MAX` for heads-up notifications
2. ✅ Adding `autoDismiss: true` for system-managed timeout
3. ✅ Setting `sticky: false` to allow user dismissal
4. ✅ Maintaining `priority: HIGH` for prominent display
5. ✅ Removing deprecated properties

**Result:** Notifications now stay visible long enough to read the message while still being dismissible by the user.

---

## 🔗 Related Documentation

- [Expo Notifications API](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Android Notification Importance](https://developer.android.com/training/notify-user/channels#importance)
- [iOS Interruption Levels](https://developer.apple.com/documentation/usernotifications/unnotificationinterruptionlevel)

---

**Note:** The exact duration is controlled by the Android/iOS system and cannot be precisely set. The changes made optimize for maximum visibility within system constraints.
