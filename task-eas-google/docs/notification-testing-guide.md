Let’s make a compact, ready-to-drop “Notification QA script” for your Expo React Native app. 
This will let you quickly test your local reminders on a physical device, inspect scheduled notifications, 
and cancel them if needed.

// lib/notifications/notificationQA.ts
import * as Notifications from 'expo-notifications';
import { scheduleTaskReminders, cancelTaskReminders } from './scheduler';

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
    },
    trigger: { seconds: 5 },
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

How to use this QA script ?

Let’s make a full QA dev screen for your Expo app. This will give you one page with buttons and logs to fully test local notifications, schedule reminders, list them, and cancel them.

NotificationQAScreen.tsx

import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper'; // or your preferred button component
import {
  sendQuickTestNotification,
  scheduleTestTask,
  listScheduledNotifications,
  cancelTestTaskNotifications,
  cancelAllNotifications,
} from '../lib/notifications/notificationQA';

export default function NotificationQAScreen() {
  const [log, setLog] = useState<string[]>([]);

  // Helper to append log
  const appendLog = (message: string) => {
    setLog((prev) => [message, ...prev]);
    console.log(message);
  };

  const handleQuickTest = async () => {
    const id = await sendQuickTestNotification();
    appendLog(`Quick test notification scheduled: ${id}`);
  };

  const handleScheduleTestTask = async () => {
    const ids = await scheduleTestTask();
    appendLog(`Test task reminders scheduled: ${ids.join(', ')}`);
  };

  const handleListScheduled = async () => {
    const scheduled = await listScheduledNotifications();
    appendLog(`Scheduled notifications: ${scheduled.length}`);
    scheduled.forEach((n, i) =>
      appendLog(
        `[${i}] id: ${n.identifier}, title: ${n.content.title}, trigger: ${
          (n.trigger as any)?.date || (n.trigger as any)?.seconds || 'unknown'
        }`
      )
    );
  };

  const handleCancelTestTask = async () => {
    await cancelTestTaskNotifications();
    appendLog('Test task notifications cancelled');
  };

  const handleCancelAll = async () => {
    await cancelAllNotifications();
    appendLog('All notifications cancelled');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📋 Notification QA Dev Screen</Text>
      <ScrollView style={styles.buttons}>
        <Button mode="contained" style={styles.button} onPress={handleQuickTest}>
          🚀 Send Quick Test Notification
        </Button>

        <Button mode="contained" style={styles.button} onPress={handleScheduleTestTask}>
          📝 Schedule Test Task Reminders
        </Button>

        <Button mode="contained" style={styles.button} onPress={handleListScheduled}>
          📊 List All Scheduled Notifications
        </Button>

        <Button mode="contained" style={styles.button} onPress={handleCancelTestTask}>
          ❌ Cancel Test Task Notifications
        </Button>

        <Button mode="contained" style={styles.button} onPress={handleCancelAll}>
          ⚠️ Cancel All Notifications
        </Button>
      </ScrollView>

      <ScrollView style={styles.logContainer}>
        {log.map((line, index) => (
          <Text key={index} style={styles.logLine}>
            {line}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  buttons: { marginBottom: 12 },
  button: { marginVertical: 6 },
  logContainer: { flex: 1, marginTop: 12, borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 8 },
  logLine: { fontSize: 14, color: '#333', marginBottom: 2 },
});


Features of this QA screen

Quick test notification → triggers in 5 seconds.

Schedule test task → 10-minute due date with 1 & 5-minute reminders.

List scheduled notifications → shows IDs, titles, triggers.

Cancel test task notifications → removes only test task reminders.

Cancel all notifications → clears everything (use with caution).

Logs displayed on screen + console → easy debugging without Xcode/Android Studio.

🔹 How to use ?

Import it in your navigator (or App.tsx):

import NotificationQAScreen from './screens/NotificationQAScreen';

<Stack.Screen name="NotificationQA" component={NotificationQAScreen} />


Run on a physical device (Android or iOS).

Test foreground, background, and killed app scenarios.

Observe logs for notification IDs and scheduling correctness.


