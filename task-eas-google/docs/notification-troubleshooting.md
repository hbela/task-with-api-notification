# 🔍 Notification Troubleshooting Guide

## Quick Test Steps

### Step 1: Check Notification Permissions

1. **On your Android device**, go to:
   - Settings → Apps → Your App (task-eas-google) → Notifications
   - Make sure notifications are **ENABLED**
   - Check that all notification categories are enabled

### Step 2: Run Debug Commands

Open the React Native debugger console and run these commands:

```javascript
// Import the debug utilities
import { debugNotifications, sendTestNotification } from '@/lib/notifications';

// Check current notification status
await debugNotifications();

// Send a test notification (appears in 2 seconds)
await sendTestNotification();
```

Or add this temporarily to your app to test:

```typescript
// In app/(app)/index.tsx or any screen
import { debugNotifications, sendTestNotification } from '@/lib/notifications';
import { Button } from 'react-native';

// Add these buttons to your UI
<Button title="Debug Notifications" onPress={() => debugNotifications()} />
<Button title="Send Test Notification" onPress={() => sendTestNotification()} />
```

### Step 3: Create a Test Task

1. **Create a task** with these settings:
   - Title: "Test Notification"
   - Due Date: **5 minutes from now** (very important!)
   - Enable Reminders: **ON**
   - Select: **"5 minutes before"**

2. **Save the task**

3. **Check the Metro logs** - You should see:
   ```
   [Scheduler] 📋 Scheduling reminders for task: {...}
   [Scheduler] ⏰ Checking reminder 5 minutes before: {...}
   [Scheduler] ✅ Scheduled reminder for 5 minutes before: {...}
   [Scheduler] 📊 Summary: Scheduled 1 out of 1 reminders
   ```

4. **Wait** - The notification should appear when the task is due

### Step 4: Check What Went Wrong

If you don't see the scheduling logs, the issue is in the task creation flow.
If you see the logs but no notification appears, the issue is with Android permissions or settings.

## Common Issues

### Issue 1: No Scheduling Logs

**Problem**: You don't see `[Scheduler]` logs when creating a task

**Cause**: The task might not have a due date, or reminders are disabled

**Solution**:
- Make sure you set a **due date**
- Make sure the **Reminders toggle is ON**
- Make sure you selected at least one reminder time

### Issue 2: "Skipping reminder (in the past)"

**Problem**: Log shows reminders are being skipped

**Cause**: The due date is in the past, or too soon

**Solution**:
- Set the due date to at least **10 minutes from now**
- Select "5 minutes before" as the reminder time
- This gives you a 5-minute window to receive the notification

### Issue 3: Notifications Scheduled But Not Appearing

**Problem**: Logs show notifications scheduled, but they don't appear

**Possible Causes**:
1. **Notification permissions not granted**
2. **Battery optimization killing the app**
3. **Do Not Disturb mode enabled**
4. **Notification channel disabled**

**Solutions**:

#### A. Check Permissions
```
Settings → Apps → Your App → Notifications → Enable All
```

#### B. Disable Battery Optimization
```
Settings → Apps → Your App → Battery → Unrestricted
```

#### C. Check Do Not Disturb
```
Settings → Sound → Do Not Disturb → Turn OFF
```

#### D. Check Notification Channel
```
Settings → Apps → Your App → Notifications → Task Reminders → Enable
```

### Issue 4: App Crashes When Creating Task

**Problem**: App crashes or freezes when saving a task

**Cause**: Notification scheduling error

**Solution**: Check Metro logs for error details

## Testing Checklist

- [ ] Notification permission granted in Android settings
- [ ] Battery optimization disabled for the app
- [ ] Do Not Disturb mode is OFF
- [ ] Created task with due date 5+ minutes in future
- [ ] Enabled reminders toggle
- [ ] Selected "5 minutes before" reminder
- [ ] Saw `[Scheduler]` logs in Metro
- [ ] Saw "Scheduled X out of X reminders" message
- [ ] Waited for notification to appear

## Debug Output Example

When everything works correctly, you should see:

```
[Scheduler] 📋 Scheduling reminders for task: {
  id: 123,
  title: "Test Task",
  dueDate: "2026-01-14T16:00:00.000Z",
  reminderTimes: [5]
}
[Scheduler] ⏰ Checking reminder 5 minutes before: {
  triggerDate: "2026-01-14T15:55:00.000Z",
  now: "2026-01-14T15:50:00.000Z",
  isPast: false
}
[Scheduler] ✅ Scheduled reminder for 5 minutes before: {
  notificationId: "abc-123-def",
  triggerDate: "2026-01-14T15:55:00.000Z",
  title: "⏰ Task due in 5 minutes!"
}
[Scheduler] 📊 Summary: Scheduled 1 out of 1 reminders
```

## Next Steps

1. **Try the test notification** first (appears in 2 seconds)
2. **If test works**: The issue is with task scheduling
3. **If test doesn't work**: The issue is with Android permissions

Let me know what you see in the logs!
