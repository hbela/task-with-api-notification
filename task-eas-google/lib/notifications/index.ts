import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { registerForPushNotifications } from './push';
import { cancelTaskReminders, scheduleDailySummary, scheduleTaskReminders } from './scheduler';

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Enhanced Notification Service with support for multiple reminders,
 * push notifications, and improved configuration
 */
export class NotificationService {
  private static instance: NotificationService;
  private pushToken: string | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service
   * Call this once when the app starts
   */
  async initialize(): Promise<NotificationService> {
    try {
      await this.requestPermissions();
      await this.configureAndroidChannel();
      
      // Register for push notifications (for backup/server-initiated alerts)
      this.pushToken = await registerForPushNotifications();
      
      console.log('Notification service initialized successfully');
      return this;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      throw error;
    }
  }

  /**
   * Request notification permissions
   */
  private async requestPermissions(): Promise<string> {
    if (!Device.isDevice) {
      console.warn('Notifications only work on physical devices');
      return 'denied';
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowCriticalAlerts: true, // For iOS 12+
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      // You might want to show a UI prompt here explaining why notifications are important
    }

    return finalStatus;
  }

  /**
   * Configure Android notification channel
   */
  private async configureAndroidChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('task-reminders', {
        name: 'Task Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#007AFF',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true, // Bypass Do Not Disturb for important task reminders
        sound: 'default',
        enableVibrate: true,
        showBadge: false, // Consistent with shouldSetBadge: false
      });
      console.log('Android notification channel configured');
    }
  }

  /**
   * Schedule reminders for a task
   * @param task - Task object with id, title, dueDate, and optional reminderTimes
   * @returns Array of notification IDs
   */
  async scheduleTaskReminder(task: {
    id: number;
    title: string;
    dueDate: Date;
    description?: string;
    reminderTimes?: number[]; // minutes before due date
  }): Promise<string[]> {
    try {
      const notificationIds = await scheduleTaskReminders(task);
      console.log(`Scheduled ${notificationIds.length} reminders for task ${task.id}`);
      return notificationIds;
    } catch (error) {
      console.error('Failed to schedule task reminders:', error);
      return [];
    }
  }

  /**
   * Cancel all reminders for a task
   */
  async cancelTaskReminders(taskId: number): Promise<void> {
    try {
      await cancelTaskReminders(taskId);
      console.log(`Cancelled all reminders for task ${taskId}`);
    } catch (error) {
      console.error('Failed to cancel task reminders:', error);
    }
  }

  /**
   * Reschedule reminders for a task (cancel old and create new)
   */
  async rescheduleTaskReminders(task: {
    id: number;
    title: string;
    dueDate: Date;
    description?: string;
    reminderTimes?: number[];
  }): Promise<string[]> {
    await this.cancelTaskReminders(task.id);
    return this.scheduleTaskReminder(task);
  }

  /**
   * Schedule daily summary notification
   * @param hour - Hour of the day (0-23), default is 9 AM
   */
  async scheduleDailySummary(hour: number = 9): Promise<void> {
    try {
      await scheduleDailySummary(hour);
      console.log(`Daily summary scheduled for ${hour}:00`);
    } catch (error) {
      console.error('Failed to schedule daily summary:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getAllScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
  }

  /**
   * Set up notification response listener (for when user taps notification)
   * @param onNotificationTap - Callback function that receives the task ID
   * @returns Subscription object (call .remove() to unsubscribe)
   */
  setupNotificationListener(onNotificationTap: (taskId: string) => void) {
    return Notifications.addNotificationResponseReceivedListener((response) => {
      const taskId = response.notification.request.content.data.taskId as string;
      if (taskId) {
        console.log('Notification tapped for task:', taskId);
        onNotificationTap(taskId);
      }
    });
  }

  /**
   * Get the push token (if registered)
   */
  getPushToken(): string | null {
    return this.pushToken;
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Re-export utilities for convenience
export {
    cancelTaskReminders, DEFAULT_REMINDER_OPTIONS, DEFAULT_REMINDERS, getReminderLabel, scheduleDailySummary, scheduleTaskReminders
} from './scheduler';

export {
    registerForPushNotifications, removePushTokenFromServer, sendPushTokenToServer
} from './push';

// Debug utilities
export {
    debugNotifications,
    sendTestNotification
} from './debug';
