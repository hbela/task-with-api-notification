import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

/**
 * Register for Expo push notifications (OPTIONAL - requires Firebase setup)
 * 
 * ⚠️ This is a BACKUP feature. Local notifications work perfectly without this!
 * 
 * Push notifications are only needed if you want:
 * - Server-initiated notifications
 * - Cross-device notification sync
 * - Backup for missed local notifications
 * 
 * To enable push notifications (optional):
 * 1. Follow guide: https://docs.expo.dev/push-notifications/fcm-credentials/
 * 2. Set up Firebase for your project
 * 3. Configure google-services.json (Android) and GoogleService-Info.plist (iOS)
 * 
 * @returns Expo push token or null if registration fails or Firebase not configured
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('[Push] Skipping: Push notifications only work on physical devices');
    return null;
  }

  try {
    // Check if we have permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Get the project ID from app.json
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn('Project ID not found for push notifications. Add it to app.json under extra.eas.projectId');
      return null;
    }

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({ 
      projectId 
    });
    
    const token = tokenData.data;
    console.log('Expo push token:', token);

    return token;
  } catch (error: any) {
    // Check if it's a Firebase error
    if (error?.message?.includes('FirebaseApp') || error?.message?.includes('Firebase')) {
      console.log('[Push] ℹ️  Firebase not configured - Push notifications disabled (local notifications still work!)');
      console.log('[Push] To enable push notifications, follow: https://docs.expo.dev/push-notifications/fcm-credentials/');
    } else {
      console.warn('[Push] Failed to register for push notifications:', error?.message || error);
    }
    return null;
  }
}

/**
 * Send push token to backend for storage
 * This allows the server to send push notifications to this device
 */
export async function sendPushTokenToServer(
  token: string,
  apiClient: any
): Promise<boolean> {
  try {
    await apiClient.post('/users/push-token', { token });
    console.log('Push token sent to server successfully');
    return true;
  } catch (error) {
    console.error('Failed to send push token to server:', error);
    return false;
  }
}

/**
 * Remove push token from server (e.g., on logout)
 */
export async function removePushTokenFromServer(
  apiClient: any
): Promise<boolean> {
  try {
    await apiClient.delete('/users/push-token');
    console.log('Push token removed from server');
    return true;
  } catch (error) {
    console.error('Failed to remove push token from server:', error);
    return false;
  }
}
