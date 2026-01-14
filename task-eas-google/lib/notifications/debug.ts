import * as Notifications from 'expo-notifications';

/**
 * Debug utility to check notification status
 * Call this to see what's going on with notifications
 */
export async function debugNotifications() {
  console.log('\n========== NOTIFICATION DEBUG INFO ==========');
  
  // Check permissions
  const { status } = await Notifications.getPermissionsAsync();
  console.log('📱 Permission Status:', status);
  
  if (status !== 'granted') {
    console.log('⚠️  WARNING: Notification permission not granted!');
    console.log('   Go to: Settings → Apps → Your App → Notifications');
    return;
  }
  
  // Get all scheduled notifications
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log(`📋 Total Scheduled Notifications: ${scheduled.length}`);
  
  if (scheduled.length === 0) {
    console.log('⚠️  No notifications scheduled!');
    console.log('   Try creating a task with a due date and reminders enabled.');
  } else {
    console.log('\n📅 Scheduled Notifications:');
    scheduled.forEach((notif, index) => {
      const trigger = notif.trigger as any;
      console.log(`\n${index + 1}. ${notif.content.title}`);
      console.log(`   Body: ${notif.content.body}`);
      console.log(`   ID: ${notif.identifier}`);
      console.log(`   Trigger Date: ${trigger.value ? new Date(trigger.value).toLocaleString() : 'Unknown'}`);
      console.log(`   Task ID: ${notif.content.data?.taskId || 'N/A'}`);
      console.log(`   Type: ${notif.content.data?.type || 'N/A'}`);
    });
  }
  
  console.log('\n============================================\n');
}

/**
 * Test notification - sends immediately
 */
export async function sendTestNotification() {
  try {
    console.log('[Test] Sending test notification...');
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Test Notification',
        body: 'If you see this, notifications are working!',
        data: { type: 'test' },
        sound: 'default',
      },
      trigger: {
        seconds: 2, // Send in 2 seconds
        channelId: 'task-reminders',
      },
    });
    
    console.log('[Test] ✅ Test notification scheduled for 2 seconds from now');
  } catch (error) {
    console.error('[Test] ❌ Failed to send test notification:', error);
  }
}
