/**
 * Example Component: Localized Task List
 * 
 * This is a demonstration of how to use the i18n system in your components.
 * Copy and adapt this pattern for your own components.
 */

import { useTranslation } from '@/hooks/useTranslation';
import { formatDateTime, formatTaskDueDate } from '@/utils/dateFormatter';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  createdAt: Date;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export default function LocalizedTaskListExample() {
  // Use the custom hook for translations
  const { t } = useTranslation();

  // Sample tasks for demonstration
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Complete project proposal',
      description: 'Finish the Q1 project proposal',
      dueDate: new Date(Date.now() + 86400000), // Tomorrow
      createdAt: new Date(),
      completed: false,
      priority: 'high',
    },
    {
      id: '2',
      title: 'Team meeting',
      description: 'Weekly sync with the team',
      dueDate: new Date(), // Today
      createdAt: new Date(Date.now() - 172800000), // 2 days ago
      completed: false,
      priority: 'medium',
    },
  ];

  const renderTask = ({ item }: { item: Task }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Text style={[
          styles.priorityBadge,
          item.priority === 'high' && styles.highPriority
        ]}>
          {t('tasks.priority')}: {item.priority}
        </Text>
      </View>
      
      <Text style={styles.taskDescription}>{item.description}</Text>
      
      <View style={styles.taskMeta}>
        <Text style={styles.metaText}>
          {t('tasks.dueDate')}: {formatTaskDueDate(item.dueDate)}
        </Text>
        <Text style={styles.metaText}>
          {t('common.created')}: {formatDateTime(item.createdAt)}
        </Text>
      </View>
      
      <Text style={styles.statusText}>
        {item.completed ? t('tasks.completed') : t('tasks.pending')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('tasks.upcoming')}</Text>
      
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('tasks.empty')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  taskCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  priorityBadge: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    color: '#666',
  },
  highPriority: {
    backgroundColor: '#ffebee',
    color: '#c62828',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  taskMeta: {
    gap: 4,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
