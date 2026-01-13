import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  /**
   * Request notification permissions
   */
  static async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('Notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get notification permissions');
      return false;
    }

    // For Android, set notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('task-reminders', {
        name: 'Task Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#007AFF',
        sound: 'default',
      });
    }

    return true;
  }

  /**
   * Schedule a notification for a task
   * @param taskId - The task ID
   * @param taskTitle - The task title
   * @param dueDate - When the task is due (ISO string)
   * @param reminderMinutes - How many minutes before due date to remind (default: 60)
   */
  static async scheduleTaskReminder(
    taskId: number,
    taskTitle: string,
    dueDate: string,
    reminderMinutes: number = 60
  ): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const dueDateTime = new Date(dueDate);
      const reminderTime = new Date(dueDateTime.getTime() - reminderMinutes * 60 * 1000);

      // Don't schedule if reminder time is in the past
      if (reminderTime <= new Date()) {
        console.log('Reminder time is in the past, skipping notification');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📋 Task Due Soon',
          body: `"${taskTitle}" is due in ${reminderMinutes} minutes`,
          data: { 
            taskId: taskId.toString(),
            type: 'task-reminder'
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          date: reminderTime,
          channelId: 'task-reminders',
        },
      });

      // Store notification ID mapping
      await this.saveNotificationMapping(taskId, notificationId);

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Cancel a notification for a task
   */
  static async cancelTaskReminder(taskId: number): Promise<void> {
    try {
      const notificationId = await this.getNotificationId(taskId);
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        await this.removeNotificationMapping(taskId);
      }
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Reschedule a notification (cancel old and create new)
   */
  static async rescheduleTaskReminder(
    taskId: number,
    taskTitle: string,
    dueDate: string,
    reminderMinutes: number = 60
  ): Promise<string | null> {
    await this.cancelTaskReminder(taskId);
    return this.scheduleTaskReminder(taskId, taskTitle, dueDate, reminderMinutes);
  }

  /**
   * Get all scheduled notifications
   */
  static async getAllScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Cancel all notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem('notification_mappings');
  }

  /**
   * Save notification ID mapping to AsyncStorage
   */
  private static async saveNotificationMapping(taskId: number, notificationId: string): Promise<void> {
    try {
      const mappings = await this.getNotificationMappings();
      mappings[taskId.toString()] = notificationId;
      await AsyncStorage.setItem('notification_mappings', JSON.stringify(mappings));
    } catch (error) {
      console.error('Error saving notification mapping:', error);
    }
  }

  /**
   * Get notification ID for a task
   */
  private static async getNotificationId(taskId: number): Promise<string | null> {
    try {
      const mappings = await this.getNotificationMappings();
      return mappings[taskId.toString()] || null;
    } catch (error) {
      console.error('Error getting notification ID:', error);
      return null;
    }
  }

  /**
   * Remove notification mapping
   */
  private static async removeNotificationMapping(taskId: number): Promise<void> {
    try {
      const mappings = await this.getNotificationMappings();
      delete mappings[taskId.toString()];
      await AsyncStorage.setItem('notification_mappings', JSON.stringify(mappings));
    } catch (error) {
      console.error('Error removing notification mapping:', error);
    }
  }

  /**
   * Get all notification mappings
   */
  private static async getNotificationMappings(): Promise<Record<string, string>> {
    try {
      const mappingsJson = await AsyncStorage.getItem('notification_mappings');
      return mappingsJson ? JSON.parse(mappingsJson) : {};
    } catch (error) {
      console.error('Error getting notification mappings:', error);
      return {};
    }
  }

  /**
   * Set up notification response listener (for when user taps notification)
   */
  static setupNotificationListener(onNotificationTap: (taskId: string) => void) {
    return Notifications.addNotificationResponseReceivedListener((response) => {
      const taskId = response.notification.request.content.data.taskId as string;
      if (taskId) {
        onNotificationTap(taskId);
      }
    });
  }
}
