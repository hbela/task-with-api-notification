# Task Notifications Implementation Guide

## ✅ Setup Complete!

All packages and configurations are now in place for notifications. You're ready to build!

## 📦 What Was Installed

### Packages
- ✅ `expo-notifications` - Local notification scheduling
- ✅ `expo-device` - Device detection
- ✅ `expo-constants` - App constants
- ✅ `@react-native-async-storage/async-storage` - Already installed

### Configuration
- ✅ Added `expo-notifications` plugin to app.json
- ✅ Added `@react-native-async-storage/async-storage` plugin
- ✅ Added Android permissions (POST_NOTIFICATIONS, SCHEDULE_EXACT_ALARM)
- ✅ Configured notification channel for Android

### Code Created
- ✅ `lib/notifications/index.ts` - Complete notification service
- ✅ Updated `types/task.ts` - Added dueDate and notificationId fields

## 🏗️ Database Schema Update Needed

Before using notifications, update your backend database schema:

```sql
-- Add to Task table
ALTER TABLE "Task" 
ADD COLUMN "dueDate" TIMESTAMP,
ADD COLUMN "notificationId" TEXT;
```

Or with Prisma:

```prisma
model Task {
  id             Int       @id @default(autoincrement())
  title          String
  description    String?
  completed      Boolean   @default(false)
  userId         Int
  dueDate        DateTime? // Add this
  notificationId String?   // Add this
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([completed])
  @@index([dueDate]) // Add this index
}
```

Then run:
```bash
cd server
npx prisma migrate dev --name add_task_notifications
```

## 🚀 How to Use Notifications

### 1. Request Permissions (in App Root Layout)

Add to `app/_layout.tsx`:

```typescript
import { NotificationService } from '@/lib/notifications';
import { useEffect } from 'react';

// Inside your component
useEffect(() => {
  // Request notification permissions on app start
  NotificationService.requestPermissions();
}, []);
```

### 2. Schedule Notification When Creating Task

Update `app/(app)/create.tsx`:

```typescript
import { NotificationService } from '@/lib/notifications';

const handleSubmit = async (data: CreateTaskInput) => {
  setLoading(true);
  try {
    // Create the task
    const newTask = await createTask(data);
    
    // Schedule notification if dueDate is provided
    if (data.dueDate) {
      await NotificationService.scheduleTaskReminder(
        newTask.id,
        newTask.title,
        data.dueDate,
        60 // Remind 60 minutes before
      );
    }
    
    Alert.alert('Success', 'Task created successfully!');
    router.push('/(app)');
  } catch (error: any) {
    Alert.alert('Error', error.message);
  } finally {
    setLoading(false);
  }
};
```

### 3. Cancel Notification When Deleting Task

Update `hooks/useTasks.ts`:

```typescript
import { NotificationService } from '@/lib/notifications';

const deleteTask = useCallback(async (id: number): Promise<void> => {
  setLoading(true);
  try {
    // Cancel notification first
    await NotificationService.cancelTaskReminder(id);
    
    // Then delete task
    await tasksApi.delete(id);
    
    setTasks(prev => prev.filter(task => task.id !== id));
    setPagination(prev => ({
      ...prev,
      total: Math.max(0, prev.total - 1)
    }));
  } catch (err: any) {
    const errorMessage = err.message || 'Failed to delete task';
    setError(errorMessage);
    throw new Error(errorMessage);
  } finally {
    setLoading(false);
  }
}, []);
```

### 4. Reschedule When Updating Task

Update `hooks/useTasks.ts`:

```typescript
const updateTask = useCallback(async (id: number, data: UpdateTaskInput): Promise<Task> => {
  setLoading(true);
  try {
    const updatedTask = await tasksApi.update(id, data);
    
    // Reschedule notification if dueDate changed
    if (data.dueDate) {
      await NotificationService.rescheduleTaskReminder(
        id,
        updatedTask.title,
        updatedTask.dueDate!,
        60
      );
    }
    
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...updatedTask } : task
    ));

    return updatedTask;
  } catch (err: any) {
    const errorMessage = err.message || 'Failed to update task';
    setError(errorMessage);
    throw new Error(errorMessage);
  } finally {
    setLoading(false);
  }
}, []);
```

### 5. Handle Notification Taps (Deep Linking)

Add to `app/_layout.tsx`:

```typescript
import { NotificationService } from '@/lib/notifications';
import { useRouter } from 'expo-router';

function RootLayoutNav() {
  const router = useRouter();
  
  useEffect(() => {
    // Set up notification tap handler
    const subscription = NotificationService.setupNotificationListener((taskId) => {
      // Navigate to task detail when notification is tapped
      router.push(`/(app)/task/${taskId}`);
    });

    return () => subscription.remove();
  }, []);
  
  // ... rest of component
}
```

## 📝 Adding Due Date to Task Form

Update `components/TaskForm.tsx` to include a date picker:

```typescript
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';

// Inside component
const [dueDate, setDueDate] = useState<Date | null>(null);
const [showDatePicker, setShowDatePicker] = useState(false);

// In the form JSX
<View style={styles.inputGroup}>
  <Text style={styles.label}>Due Date (Optional)</Text>
  <TouchableOpacity
    style={styles.dateButton}
    onPress={() => setShowDatePicker(true)}
  >
    <Text>
      {dueDate ? dueDate.toLocaleDateString() : 'Set due date'}
    </Text>
  </TouchableOpacity>
  
  {showDatePicker && (
    <DateTimePicker
      value={dueDate || new Date()}
      mode="datetime"
      onChange={(event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
          setDueDate(selectedDate);
        }
      }}
    />
  )}
</View>

// In handleSubmit
const data: CreateTaskInput = {
  title: title.trim(),
  description: description.trim() || undefined,
  dueDate: dueDate?.toISOString(),
};
```

## 🧪 Testing Notifications

### Test on Physical Device
1. Build and install the app
2. Create a task with a due date 2-3 minutes in the future
3. Close the app
4. Wait for the notification
5. Tap the notification - should open task detail

### Debug Notifications
```typescript
// Check scheduled notifications
const scheduled = await NotificationService.getAllScheduledNotifications();
console.log('Scheduled notifications:', scheduled);

// Check notification mappings
const mappings = await AsyncStorage.getItem('notification_mappings');
console.log('Notification mappings:', mappings);
```

## ⚙️ Notification Service API

### Methods Available

```typescript
// Request permissions
await NotificationService.requestPermissions();

// Schedule notification
const notificationId = await NotificationService.scheduleTaskReminder(
  taskId,
  taskTitle,
  dueDate,
  reminderMinutes // default: 60
);

// Cancel notification
await NotificationService.cancelTaskReminder(taskId);

// Reschedule notification
await NotificationService.rescheduleTaskReminder(
  taskId,
  taskTitle,
  newDueDate,
  reminderMinutes
);

// Get all scheduled
const notifications = await NotificationService.getAllScheduledNotifications();

// Cancel all
await NotificationService.cancelAllNotifications();

// Set up tap listener
const subscription = NotificationService.setupNotificationListener((taskId) => {
  // Handle notification tap
});
```

## 🎨 Customization Options

### Change Reminder Time
```typescript
// Remind 30 minutes before
await NotificationService.scheduleTaskReminder(id, title, dueDate, 30);

// Remind 2 hours before
await NotificationService.scheduleTaskReminder(id, title, dueDate, 120);
```

### Multiple Reminders
```typescript
// Schedule multiple reminders for same task
await NotificationService.scheduleTaskReminder(id, title, dueDate, 60);  // 1 hour
await NotificationService.scheduleTaskReminder(id, title, dueDate, 1440); // 1 day
```

### Custom Notification Content
Modify `lib/notifications/index.ts`:

```typescript
content: {
  title: '🔔 Custom Title',
  body: `Custom message for ${taskTitle}`,
  data: { 
    taskId: taskId.toString(),
    type: 'custom-type',
    customData: 'anything'
  },
}
```

## ✅ Pre-Build Checklist

Before running `eas build`:

- [x] expo-notifications installed
- [x] expo-device installed
- [x] expo-constants installed
- [x] @react-native-async-storage/async-storage installed
- [x] expo-notifications plugin added to app.json
- [x] @react-native-async-storage/async-storage plugin added
- [x] Android permissions added
- [x] NotificationService created
- [x] Task types updated
- [ ] Database schema updated (do this on backend)
- [ ] Backend API updated to handle dueDate field

## 🚀 Ready to Build!

Everything is configured. Run:

```bash
eas build --profile development --platform android
```

This single build will include:
- ✅ AsyncStorage (fixed)
- ✅ Notifications (ready)
- ✅ All other features

## 📚 Additional Resources

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Local Notifications Guide](https://docs.expo.dev/push-notifications/sending-notifications/)
- [Notification Permissions](https://docs.expo.dev/versions/latest/sdk/notifications/#permissions)

---

**Status**: ✅ Ready for build!
**Next**: Update backend schema, then build with `eas build`
