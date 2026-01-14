For functional alerts like "Task due tomorrow," you'll want **local scheduled notifications** (for reliable, app-triggered reminders) combined with **Expo Push Notifications** (for server-initiated alerts or cross-device sync). Here's the most effective implementation strategy:

## 📋 **Recommended Hybrid Approach**

| Notification Type | Purpose | Implementation |
| :--- | :--- | :--- |
| **Local Scheduled** | Core in-app reminders: "Task due in 1 hour", daily summaries | `expo-notifications` scheduler |
| **Push Notifications** | Backup sync for missed local alerts, server-side triggers | Expo Push Service + your Fastify backend |

## 🛠️ **Implementation: Local Scheduled Notifications**

### **1. Install & Configure**
```bash
npx expo install expo-notifications expo-task-manager
```

Add the plugin to your `app.json`:
```json
{
  "expo": {
    "plugins": ["expo-notifications"]
  }
}
```

### **2. Create Notification Service (`/lib/notifications/index.ts`)**
```typescript
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { scheduleTaskReminders, cancelTaskReminders } from './scheduler';
import { registerForPushNotifications } from './push';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;

  static getInstance() {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize notifications
  async initialize() {
    await this.requestPermissions();
    await this.configureAndroidChannel();
    await registerForPushNotifications(); // For backup push
    return this;
  }

  private async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: true, // For iOS 12+
      },
    });
    
    if (status !== 'granted') {
      alert('You need to enable notifications for task reminders to work properly.');
    }
    return status;
  }

  private async configureAndroidChannel() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('task-reminders', {
        name: 'Task Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true, // Bypass Do Not Disturb
        sound: 'default',
      });
    }
  }

  // Schedule task reminders
  async scheduleTaskReminder(task: {
    id: string;
    title: string;
    dueDate: Date;
    reminderTimes?: number[]; // minutes before due date
  }) {
    const notifications = await scheduleTaskReminders(task);
    console.log(`Scheduled ${notifications.length} reminders for task ${task.id}`);
    return notifications;
  }

  // Cancel all reminders for a task
  async cancelTaskReminders(taskId: string) {
    await cancelTaskReminders(taskId);
  }

  // Get all scheduled notifications
  async getScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
}

export const notificationService = NotificationService.getInstance();
```

### **3. Create Scheduler Logic (`/lib/notifications/scheduler.ts`)**
```typescript
import * as Notifications from 'expo-notifications';

interface Task {
  id: string;
  title: string;
  dueDate: Date;
  description?: string;
  reminderTimes?: number[]; // Default: [60, 1440] (1 hour, 1 day)
}

export async function scheduleTaskReminders(task: Task): Promise<string[]> {
  const reminderTimes = task.reminderTimes || [60, 1440]; // 1 hour, 24 hours
  const notificationIds: string[] = [];

  for (const minutesBefore of reminderTimes) {
    const triggerDate = new Date(task.dueDate.getTime() - minutesBefore * 60 * 1000);
    
    // Don't schedule if reminder is in the past
    if (triggerDate.getTime() <= Date.now()) continue;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: getNotificationTitle(minutesBefore),
        body: task.title,
        data: {
          taskId: task.id,
          type: 'task-reminder',
          dueDate: task.dueDate.toISOString(),
          url: `/task/${task.id}`, // For deep linking
        },
        sound: 'default',
        categoryIdentifier: 'TASK_REMINDER',
        // iOS 15+ interruption level
        ...(Platform.OS === 'ios' && {
          interruptionLevel: 'timeSensitive',
        }),
      },
      trigger: {
        type: 'date',
        date: triggerDate,
      },
    });

    notificationIds.push(notificationId);
  }

  return notificationIds;
}

function getNotificationTitle(minutesBefore: number): string {
  if (minutesBefore <= 60) {
    return `Task due in ${minutesBefore} minute${minutesBefore !== 1 ? 's' : ''}`;
  } else if (minutesBefore <= 120) {
    return 'Task due in 2 hours';
  } else if (minutesBefore <= 1440) {
    return 'Task due tomorrow';
  } else {
    const days = Math.floor(minutesBefore / 1440);
    return `Task due in ${days} day${days !== 1 ? 's' : ''}`;
  }
}

export async function cancelTaskReminders(taskId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const taskNotifications = scheduled.filter(notif => 
    notif.content.data?.taskId === taskId
  );
  
  for (const notif of taskNotifications) {
    await Notifications.cancelScheduledNotificationAsync(notif.identifier);
  }
}

// Schedule daily summary at 9 AM
export async function scheduleDailySummary(hour: number = 9) {
  const now = new Date();
  const triggerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0);
  
  // If it's already past 9 AM today, schedule for tomorrow
  if (triggerDate.getTime() <= now.getTime()) {
    triggerDate.setDate(triggerDate.getDate() + 1);
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your Daily Tasks',
      body: 'Check your tasks for today',
      data: { type: 'daily-summary', url: '/' },
      sound: 'default',
    },
    trigger: {
      type: 'daily',
      hour,
      minute: 0,
      repeats: true,
    },
  });
}
```

### **4. Integrate with Task CRUD Operations**
Update your task hooks to automatically schedule/cancel notifications:

```typescript
// hooks/useTasks.ts - Updated
import { notificationService } from '@/lib/notifications';

export const useTasks = () => {
  // ... existing state and functions

  const createTask = useCallback(async (taskData: {
    title: string;
    description?: string;
    dueDate?: Date;
    reminderTimes?: number[];
  }) => {
    setLoading(true);
    try {
      // 1. Create task in backend
      const response = await tasksApi.create(taskData);
      const task = response.task;

      // 2. Schedule notifications if due date exists
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        await notificationService.scheduleTaskReminder({
          id: task.id,
          title: task.title,
          dueDate,
          reminderTimes: taskData.reminderTimes,
        });
      }

      // 3. Update local state
      setTasks(prev => [task, ...prev]);
      return task;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTask = useCallback(async (id: string, updates: {
    title?: string;
    description?: string;
    dueDate?: Date;
    reminderTimes?: number[];
  }) => {
    setLoading(true);
    try {
      // 1. Cancel existing notifications
      await notificationService.cancelTaskReminders(id);

      // 2. Update task in backend
      const response = await tasksApi.update(id, updates);
      const updatedTask = response.task;

      // 3. Reschedule notifications if due date changed
      if (updates.dueDate || (updates.reminderTimes && updatedTask.dueDate)) {
        const dueDate = updates.dueDate ? new Date(updates.dueDate) : new Date(updatedTask.dueDate);
        await notificationService.scheduleTaskReminder({
          id: updatedTask.id,
          title: updatedTask.title,
          dueDate,
          reminderTimes: updates.reminderTimes || updatedTask.reminderTimes,
        });
      }

      // 4. Update local state
      setTasks(prev => prev.map(task => 
        task.id === id ? updatedTask : task
      ));
      return updatedTask;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    setLoading(true);
    try {
      // 1. Cancel notifications
      await notificationService.cancelTaskReminders(id);
      
      // 2. Delete from backend
      await tasksApi.delete(id);
      
      // 3. Update local state
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ... rest of the hook
};
```

### **5. Task Form with Reminder Options**
```tsx
// components/TaskForm.tsx
import React, { useState } from 'react';
import { View, TextInput, Switch, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TaskFormProps {
  initialData?: {
    title: string;
    description: string;
    dueDate?: Date;
    reminderTimes?: number[];
  };
  onSubmit: (data: any) => Promise<void>;
}

const DEFAULT_REMINDERS = [60, 1440]; // 1 hour, 1 day

export default function TaskForm({ initialData, onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(initialData?.dueDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [enableReminders, setEnableReminders] = useState(!!initialData?.dueDate);
  const [reminderOptions, setReminderOptions] = useState<number[]>(
    initialData?.reminderTimes || DEFAULT_REMINDERS
  );

  const handleSubmit = async () => {
    await onSubmit({
      title,
      description,
      dueDate,
      reminderTimes: enableReminders ? reminderOptions : undefined,
    });
  };

  return (
    <View style={{ padding: 16 }}>
      <TextInput
        placeholder="Task Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      
      <TextInput
        placeholder="Description (optional)"
        value={description}
        onChangeText={setDescription}
        multiline
        style={[styles.input, { height: 100 }]}
      />

      {/* Due Date Picker */}
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text>{dueDate ? `Due: ${dueDate.toLocaleDateString()}` : 'Set Due Date'}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDueDate(selectedDate);
              setEnableReminders(true);
            }
          }}
        />
      )}

      {/* Reminder Toggle */}
      {dueDate && (
        <View style={styles.reminderSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Switch
              value={enableReminders}
              onValueChange={setEnableReminders}
            />
            <Text style={{ marginLeft: 8 }}>Enable Reminders</Text>
          </View>

          {enableReminders && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontWeight: '600', marginBottom: 8 }}>Remind me:</Text>
              {DEFAULT_REMINDERS.map((minutes) => {
                const isSelected = reminderOptions.includes(minutes);
                const label = getReminderLabel(minutes);
                
                return (
                  <TouchableOpacity
                    key={minutes}
                    style={[
                      styles.reminderOption,
                      isSelected && styles.reminderOptionSelected
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setReminderOptions(prev => prev.filter(m => m !== minutes));
                      } else {
                        setReminderOptions(prev => [...prev, minutes]);
                      }
                    }}
                  >
                    <Text>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Save Task</Text>
      </TouchableOpacity>
    </View>
  );
}

function getReminderLabel(minutes: number): string {
  if (minutes === 60) return '1 hour before';
  if (minutes === 1440) return '1 day before';
  if (minutes === 60 * 12) return '12 hours before';
  if (minutes === 5) return '5 minutes before';
  return `${minutes} minutes before`;
}
```

### **6. Initialize on App Start**
```tsx
// app/_layout.tsx
import { useEffect } from 'react';
import { notificationService } from '@/lib/notifications';

export default function RootLayout() {
  useEffect(() => {
    // Initialize notifications
    notificationService.initialize().then(() => {
      console.log('Notification service initialized');
      
      // Schedule daily summary at 9 AM
      scheduleDailySummary(9);
    }).catch(error => {
      console.error('Failed to initialize notifications:', error);
    });
  }, []);

  // ... rest of your layout
}
```

### **7. Backup Push Notifications**
For critical reminders that shouldn't be missed (even if app is closed), implement backup push notifications:

```typescript
// lib/notifications/push.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { api } from '@/lib/api';

export async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return null;

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('Project ID not found for push notifications');
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  
  // Send token to backend for backup notifications
  try {
    await api.post('/users/push-token', { token });
  } catch (error) {
    console.error('Failed to register push token:', error);
  }

  return token;
}

// In your backend, create a service to send backup notifications
// when local notifications might fail (app killed, device rebooted)
```

### **8. Database Schema Updates**
Add these fields to your User and Task tables:

```sql
-- User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS expo_push_token TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "enabled": true,
  "dailySummary": true,
  "reminderAlerts": true
}'::jsonb;

-- Task table
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS reminder_times INTEGER[] DEFAULT ARRAY[60, 1440];
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS notification_ids TEXT[] DEFAULT '{}';
```

## 🔧 **Testing Checklist**

| Test Scenario | Expected Result |
|---------------|-----------------|
| Create task with due date | Notifications scheduled for configured times |
| Update task due date | Old notifications cancelled, new ones scheduled |
| Delete task | All related notifications cancelled |
| App closed when reminder time arrives | Notification appears at exact time |
| Tap notification | App opens to the specific task detail |
| Device reboot | Local notifications persist (Android 6+, iOS) |
| Change time zone | Notifications adjust to new time zone |

## 🚀 **Production Considerations**

1. **Background Sync**: For critical reminders, implement a periodic background sync with your backend to ensure no reminders are missed
2. **Battery Optimization**: Guide Android users to disable battery optimization for your app
3. **Permission Handling**: Implement graceful permission requests with clear explanations
4. **Error Logging**: Log notification scheduling failures to your backend
5. **Cross-Device Sync**: Use Expo Push Notifications as backup for users with multiple devices

This implementation ensures reliable task reminders using local notifications (best for battery and reliability) with push notifications as a backup system. The local approach works even when the user is offline and provides the most precise timing for "due in 1 hour" alerts.