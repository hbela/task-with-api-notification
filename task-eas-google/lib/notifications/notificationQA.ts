import * as Notifications from 'expo-notifications';
import { cancelTaskReminders, scheduleTaskReminders } from './scheduler';

interface TestTask {
  id: number;
  title: string;
  dueDate: Date;
  reminderTimes?: number[];
}

/**
 * Trigger a test notification in 5 seconds
 */
export async function sendQuickTestNotification() {
  console.log('[QA] Sending test notification in 5 seconds...');
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚀 Test Notification',
      body: 'This is a quick test reminder!',
      data: { type: 'test' },
      sound: 'default',
      sticky: false,
      autoDismiss: true,
    },
    trigger: { 
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5 
    },
  });
  console.log(`[QA] Test notification scheduled with ID: ${notificationId}`);
  return notificationId;
}

/**
 * Schedule a test task with multiple reminders
 */
export async function scheduleTestTask() {
  const now = new Date();
  const task: TestTask = {
    id: 999,
    title: 'Test Task',
    dueDate: new Date(now.getTime() + 10 * 60 * 1000), // 10 minutes from now
    reminderTimes: [1, 5], // minutes before dueDate
  };

  const ids = await scheduleTaskReminders(task);
  console.log(`[QA] Scheduled test task reminders:`, ids);
  return ids;
}

/**
 * List all scheduled notifications
 */
export async function listScheduledNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log('[QA] Scheduled notifications:', scheduled);
  return scheduled;
}

/**
 * Cancel all test notifications for task ID 999
 */
export async function cancelTestTaskNotifications() {
  console.log('[QA] Cancelling test task notifications...');
  await cancelTaskReminders(999);
  console.log('[QA] Test task notifications cancelled.');
}

/**
 * Cancel all notifications (use with caution!)
 */
export async function cancelAllNotifications() {
  console.log('[QA] Cancelling all notifications...');
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('[QA] All notifications cancelled.');
}
