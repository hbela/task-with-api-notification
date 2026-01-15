# 🧪 Notification Testing - Ready to Test!

## ✅ Setup Complete

I've successfully implemented the notification QA testing infrastructure:

### 1. **Created QA Utility Module** (`lib/notifications/notificationQA.ts`)
   - `sendQuickTestNotification()` - Test notification in 5 seconds
   - `scheduleTestTask()` - Schedule test task with multiple reminders
   - `listScheduledNotifications()` - View all scheduled notifications
   - `cancelTestTaskNotifications()` - Cancel test notifications
   - `cancelAllNotifications()` - Clear all notifications

### 2. **Created QA Testing Screen** (`app/(app)/notification-qa.tsx`)
   - Beautiful UI with test buttons
   - Real-time logging display
   - Error handling
   - Easy-to-use interface

### 3. **Added to Navigation** (`app/(app)/_layout.tsx`)
   - New "QA Test" tab with flask icon 🧪
   - Accessible from the bottom navigation

### 4. **Fixed Configuration**
   - Set `shouldSetBadge: false` in notification handler
   - Fixed TypeScript errors in trigger configuration

---

## 🚀 How to Test

### Prerequisites
- **Physical device required** (notifications don't work in simulator)
- App must be running on your phone
- Notification permissions granted

### Testing Steps

1. **Start the app** (if not already running):
   ```bash
   npx expo start
   ```

2. **Open the app on your physical device**

3. **Navigate to the "QA Test" tab** (flask icon 🧪 in bottom navigation)

4. **Run these tests in order**:

   #### Test 1: Quick Notification (5 seconds)
   - Tap "🚀 Send Quick Test Notification"
   - Wait 5 seconds
   - You should see a notification appear
   - **Test scenarios**:
     - App in foreground (should show alert)
     - App in background (should show notification)
     - App killed (should still show notification)

   #### Test 2: Task Reminders (1 & 5 minutes)
   - Tap "📝 Schedule Test Task Reminders"
   - This schedules a test task due in 10 minutes
   - Reminders will fire at:
     - 9 minutes from now (1 minute before due)
     - 5 minutes from now (5 minutes before due)
   - Check the log for notification IDs

   #### Test 3: List Scheduled Notifications
   - Tap "📊 List All Scheduled Notifications"
   - View all pending notifications in the log
   - Verify IDs, titles, and trigger times

   #### Test 4: Cancel Test Task
   - Tap "❌ Cancel Test Task Notifications"
   - Then tap "List All Scheduled" to verify they're gone

   #### Test 5: Cancel All
   - Tap "⚠️ Cancel All Notifications"
   - Clears everything (use carefully!)

---

## 🔍 What to Verify

### ✅ Expected Behavior

1. **Foreground Notifications** (app open):
   - Alert appears at top of screen
   - Sound plays
   - Badge does NOT update (we set `shouldSetBadge: false`)
   - Banner shows
   - Appears in notification list

2. **Background Notifications** (app minimized):
   - Notification appears in notification center
   - Sound plays
   - Can tap to open app

3. **Killed App Notifications** (app closed):
   - Notification still fires
   - Tapping opens the app

4. **Notification Content**:
   - Title and body text correct
   - Task ID in data payload
   - Sound plays

5. **Scheduling**:
   - Notifications fire at correct times
   - Multiple reminders work
   - Cancellation works properly

---

## 📱 Testing Scenarios

### Scenario A: Immediate Test
```
1. Tap "Quick Test Notification"
2. Keep app in foreground
3. Wait 5 seconds
4. Verify alert appears
```

### Scenario B: Background Test
```
1. Tap "Quick Test Notification"
2. Immediately minimize app
3. Wait 5 seconds
4. Verify notification appears in notification center
5. Tap notification
6. Verify app opens
```

### Scenario C: Task Reminders
```
1. Tap "Schedule Test Task Reminders"
2. Tap "List All Scheduled"
3. Verify 2 notifications scheduled
4. Wait for reminders to fire
5. Verify both notifications appear
```

### Scenario D: Cancellation
```
1. Tap "Schedule Test Task Reminders"
2. Tap "List All Scheduled" (should show 2)
3. Tap "Cancel Test Task Notifications"
4. Tap "List All Scheduled" (should show 0)
```

---

## 🐛 Troubleshooting

### No notifications appearing?
- Check notification permissions in device settings
- Verify you're on a physical device (not simulator)
- Check the log output for errors
- Ensure Do Not Disturb is off

### Notifications not firing at correct time?
- Check device time settings
- Verify trigger times in "List All Scheduled"
- Check console logs for scheduling errors

### App crashes?
- Check Metro bundler for errors
- Verify all dependencies installed
- Clear cache: `npx expo start -c`

---

## 📊 Log Output Examples

### Successful Quick Test:
```
✅ Quick test notification scheduled: abc-123-def
```

### Successful Task Scheduling:
```
✅ Test task reminders scheduled: task-999-1, task-999-5
```

### List Output:
```
📊 Scheduled notifications: 2
[0] id: task-999-1, title: 📋 Task Reminder, trigger: 2026-01-15T14:41:00.000Z
[1] id: task-999-5, title: 📋 Task Reminder, trigger: 2026-01-15T14:37:00.000Z
```

---

## 🎯 Next Steps After Testing

Once you've verified notifications work:

1. **Test with real tasks** - Create actual tasks with due dates
2. **Test reminder settings** - Try different reminder times
3. **Test daily summary** - Schedule daily task summaries
4. **Test notification taps** - Verify tapping opens the correct task
5. **Test push notifications** - Configure server-side push (if needed)

---

## 📝 Notes

- The QA screen is for **development only** - remove before production
- Test task ID is hardcoded as `999`
- All test functions include error handling and logging
- Badge updates are disabled (`shouldSetBadge: false`)

---

## 🔗 Related Files

- `lib/notifications/index.ts` - Main notification service
- `lib/notifications/scheduler.ts` - Scheduling logic
- `lib/notifications/notificationQA.ts` - QA utilities
- `app/(app)/notification-qa.tsx` - QA testing screen
- `docs/notification-testing-guide.md` - Original guide

---

**Ready to test! 🎉**

Open the app, navigate to the "QA Test" tab, and start testing!
