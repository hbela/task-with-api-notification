import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
    cancelAllNotifications,
    cancelTestTaskNotifications,
    listScheduledNotifications,
    scheduleTestTask,
    sendQuickTestNotification,
} from '../../lib/notifications/notificationQA';

export default function NotificationQAScreen() {
  const [log, setLog] = useState<string[]>([]);

  // Helper to append log
  const appendLog = (message: string) => {
    setLog((prev) => [message, ...prev]);
    console.log(message);
  };

  const handleQuickTest = async () => {
    try {
      const id = await sendQuickTestNotification();
      appendLog(`✅ Quick test notification scheduled: ${id}`);
    } catch (error) {
      appendLog(`❌ Error: ${error}`);
    }
  };

  const handleScheduleTestTask = async () => {
    try {
      const ids = await scheduleTestTask();
      appendLog(`✅ Test task reminders scheduled: ${ids.join(', ')}`);
    } catch (error) {
      appendLog(`❌ Error: ${error}`);
    }
  };

  const handleListScheduled = async () => {
    try {
      const scheduled = await listScheduledNotifications();
      appendLog(`📊 Scheduled notifications: ${scheduled.length}`);
      scheduled.forEach((n, i) => {
        const trigger = n.trigger as any;
        let triggerInfo = 'unknown';
        
        if (trigger?.value) {
          // Date trigger with timestamp
          triggerInfo = new Date(trigger.value).toLocaleString();
        } else if (trigger?.seconds) {
          // Time interval trigger
          triggerInfo = `in ${trigger.seconds}s`;
        } else if (trigger?.hour !== undefined && trigger?.minute !== undefined) {
          // Daily trigger
          triggerInfo = `daily at ${trigger.hour}:${trigger.minute.toString().padStart(2, '0')}`;
        }
        
        appendLog(
          `[${i}] ${n.content.title} - ${triggerInfo}`
        );
      });
    } catch (error) {
      appendLog(`❌ Error: ${error}`);
    }
  };

  const handleCancelTestTask = async () => {
    try {
      await cancelTestTaskNotifications();
      appendLog('✅ Test task notifications cancelled');
    } catch (error) {
      appendLog(`❌ Error: ${error}`);
    }
  };

  const handleCancelAll = async () => {
    try {
      await cancelAllNotifications();
      appendLog('✅ All notifications cancelled');
    } catch (error) {
      appendLog(`❌ Error: ${error}`);
    }
  };

  const handleClearLog = () => {
    setLog([]);
    appendLog('🧹 Log cleared');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📋 Notification QA Dev Screen</Text>
      <Text style={styles.subheader}>Test local notifications on physical device</Text>
      
      <ScrollView style={styles.buttons}>
        <TestButton 
          onPress={handleQuickTest}
          title="🚀 Send Quick Test Notification"
          subtitle="Triggers in 5 seconds"
        />

        <TestButton 
          onPress={handleScheduleTestTask}
          title="📝 Schedule Test Task Reminders"
          subtitle="10-min due date with 1 & 5-min reminders"
        />

        <TestButton 
          onPress={handleListScheduled}
          title="📊 List All Scheduled Notifications"
          subtitle="Shows IDs, titles, and triggers"
        />

        <TestButton 
          onPress={handleCancelTestTask}
          title="❌ Cancel Test Task Notifications"
          subtitle="Removes only test task (ID: 999)"
        />

        <TestButton 
          onPress={handleCancelAll}
          title="⚠️ Cancel All Notifications"
          subtitle="Clears everything (use with caution)"
          danger
        />

        <TestButton 
          onPress={handleClearLog}
          title="🧹 Clear Log"
          subtitle="Reset the log display"
        />
      </ScrollView>

      <View style={styles.logSection}>
        <Text style={styles.logHeader}>📝 Log Output ({log.length})</Text>
        <ScrollView style={styles.logContainer}>
          {log.length === 0 ? (
            <Text style={styles.emptyLog}>No logs yet. Press a button to test!</Text>
          ) : (
            log.map((line, index) => (
              <Text key={index} style={styles.logLine}>
                {line}
              </Text>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

interface TestButtonProps {
  onPress: () => void;
  title: string;
  subtitle: string;
  danger?: boolean;
}

function TestButton({ onPress, title, subtitle, danger }: TestButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.button, danger && styles.dangerButton]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.buttonTitle, danger && styles.dangerText]}>{title}</Text>
      <Text style={[styles.buttonSubtitle, danger && styles.dangerSubtext]}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: '#f5f5f5' 
  },
  header: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 4,
    color: '#333'
  },
  subheader: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16
  },
  buttons: { 
    marginBottom: 12,
    maxHeight: '50%'
  },
  button: { 
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4
  },
  buttonSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8
  },
  dangerText: {
    color: '#fff'
  },
  dangerSubtext: {
    color: '#fff',
    opacity: 0.9
  },
  logSection: {
    flex: 1,
    marginTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#007AFF',
    paddingTop: 12
  },
  logHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333'
  },
  logContainer: { 
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  logLine: { 
    fontSize: 13, 
    color: '#333', 
    marginBottom: 6,
    fontFamily: 'monospace'
  },
  emptyLog: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20
  }
});
