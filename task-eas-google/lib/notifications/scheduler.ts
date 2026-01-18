import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

interface Task {
  id: number;
  title: string;
  dueDate: Date;
  description?: string;
  reminderTimes?: number[]; // Default: [60, 1440] (1 hour, 1 day)
}

/**
 * Schedule multiple reminders for a task
 * @param task - Task object with id, title, dueDate, and optional reminderTimes
 * @returns Array of notification IDs
 */
export async function scheduleTaskReminders(task: Task): Promise<string[]> {
  const now = new Date();
  const timezoneOffset = -now.getTimezoneOffset() / 60; // Convert to hours
  const timezoneStr = `UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`;
  
  // Don't schedule notifications for overdue tasks
  if (task.dueDate.getTime() <= Date.now()) {
    console.log('[Scheduler] ⏭️  Task is already overdue, skipping all notifications:', {
      dueDate: task.dueDate.toISOString(),
      dueDateLocal: task.dueDate.toLocaleString(),
      now: now.toISOString(),
      nowLocal: now.toLocaleString(),
    });
    return [];
  }
  
  console.log('[Scheduler] 📋 Scheduling reminders for task:', {
    id: task.id,
    title: task.title,
    dueDate: task.dueDate.toISOString(),
    dueDateLocal: task.dueDate.toLocaleString(),
    timezone: timezoneStr,
    reminderTimes: task.reminderTimes || [60, 1440]
  });

  const reminderTimes = task.reminderTimes || [60, 1440]; // 1 hour, 24 hours
  const notificationIds: string[] = [];

  for (const minutesBefore of reminderTimes) {
    const triggerDate = new Date(task.dueDate.getTime() - minutesBefore * 60 * 1000);
    
    console.log(`[Scheduler] ⏰ Checking reminder ${minutesBefore} minutes before:`, {
      triggerDate: triggerDate.toISOString(),
      triggerDateLocal: triggerDate.toLocaleString(),
      now: now.toISOString(),
      nowLocal: now.toLocaleString(),
      timezone: timezoneStr,
      isPast: triggerDate.getTime() <= Date.now()
    });

    // Don't schedule if reminder is in the past
    if (triggerDate.getTime() <= Date.now()) {
      console.log(`[Scheduler] ⏭️  Skipping reminder for ${minutesBefore} minutes before (in the past)`);
      continue;
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: getNotificationTitle(minutesBefore),
          body: task.title,
          data: {
            taskId: task.id.toString(),
            type: 'task-reminder',
            dueDate: task.dueDate.toISOString(),
            url: `/task/${task.id}`, // For deep linking
          },
          sound: 'default',
          categoryIdentifier: 'TASK_REMINDER',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          sticky: false, // Allow user to dismiss
          autoDismiss: true, // Auto-dismiss after timeout
          // iOS 15+ interruption level
          ...(Platform.OS === 'ios' && {
            interruptionLevel: 'timeSensitive' as any,
          }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          channelId: 'task-reminders',
        },
      });

      notificationIds.push(notificationId);
      console.log(`[Scheduler] ✅ Scheduled reminder for ${minutesBefore} minutes before:`, {
        notificationId,
        triggerDate: triggerDate.toISOString(),
        title: getNotificationTitle(minutesBefore)
      });
    } catch (error) {
      console.error(`[Scheduler] ❌ Failed to schedule reminder for ${minutesBefore} minutes:`, error);
    }
  }

  console.log(`[Scheduler] 📊 Summary: Scheduled ${notificationIds.length} out of ${reminderTimes.length} reminders`);
  return notificationIds;
}

/**
 * Get a human-readable notification title based on minutes before due date
 */
function getNotificationTitle(minutesBefore: number): string {
  if (minutesBefore <= 5) {
    return '⏰ Task due in 5 minutes!';
  } else if (minutesBefore <= 15) {
    return '⏰ Task due in 15 minutes!';
  } else if (minutesBefore <= 30) {
    return '⏰ Task due in 30 minutes!';
  } else if (minutesBefore <= 60) {
    return '⏰ Task due in 1 hour!';
  } else if (minutesBefore <= 120) {
    return '📋 Task due in 2 hours';
  } else if (minutesBefore <= 1440) {
    return '📋 Task due tomorrow';
  } else {
    const days = Math.floor(minutesBefore / 1440);
    return `📋 Task due in ${days} day${days !== 1 ? 's' : ''}`;
  }
}

/**
 * Cancel all reminders for a specific task
 * @param taskId - The task ID
 */
export async function cancelTaskReminders(taskId: number) {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const taskNotifications = scheduled.filter(notif => 
      notif.content.data?.taskId === taskId.toString()
    );
    
    for (const notif of taskNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      console.log(`Cancelled notification ${notif.identifier} for task ${taskId}`);
    }
  } catch (error) {
    console.error(`Failed to cancel reminders for task ${taskId}:`, error);
  }
}

/**
 * Schedule daily summary notification at a specific hour
 * @param hour - Hour of the day (0-23), default is 9 AM
 */
export async function scheduleDailySummary(hour: number = 9) {
  try {
    // Cancel any existing daily summary
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const dailySummaries = scheduled.filter(notif => 
      notif.content.data?.type === 'daily-summary'
    );
    
    for (const notif of dailySummaries) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }

    // Schedule new daily summary
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📋 Your Daily Tasks',
        body: 'Check your tasks for today',
        data: { type: 'daily-summary', url: '/' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
        channelId: 'task-reminders',
      },
    });

    console.log(`Scheduled daily summary at ${hour}:00`);
  } catch (error) {
    console.error('Failed to schedule daily summary:', error);
  }
}

/**
 * Get reminder label for UI display
 */
export function getReminderLabel(minutes: number, t?: (key: string) => string): string {
  // If translation function is provided, use it
  if (t) {
    if (minutes === 5) return t('tasks.reminders.5min');
    if (minutes === 15) return t('tasks.reminders.15min');
    if (minutes === 30) return t('tasks.reminders.30min');
    if (minutes === 60) return t('tasks.reminders.1hour');
    if (minutes === 60 * 2) return t('tasks.reminders.2hours');
    if (minutes === 60 * 12) return t('tasks.reminders.12hours');
    if (minutes === 1440) return t('tasks.reminders.1day');
    if (minutes === 1440 * 2) return t('tasks.reminders.2days');
    if (minutes === 1440 * 7) return t('tasks.reminders.1week');
  }
  
  // Fallback to English
  if (minutes === 5) return '5 minutes before';
  if (minutes === 15) return '15 minutes before';
  if (minutes === 30) return '30 minutes before';
  if (minutes === 60) return '1 hour before';
  if (minutes === 60 * 2) return '2 hours before';
  if (minutes === 60 * 12) return '12 hours before';
  if (minutes === 1440) return '1 day before';
  if (minutes === 1440 * 2) return '2 days before';
  if (minutes === 1440 * 7) return '1 week before';
  return `${minutes} minutes before`;
}

/**
 * Default reminder options (in minutes before due date)
 */
export const DEFAULT_REMINDER_OPTIONS = [
  5,      // 5 minutes
  15,     // 15 minutes
  30,     // 30 minutes
  60,     // 1 hour
  120,    // 2 hours
  720,    // 12 hours
  1440,   // 1 day
  2880,   // 2 days
  10080,  // 1 week
];

/**
 * Default selected reminders
 */
export const DEFAULT_REMINDERS = [60, 1440]; // 1 hour, 1 day
