import { useColorScheme } from '@/hooks/use-color-scheme';
import type { Task } from '@/lib/api';
import React from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface TaskItemProps {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(task),
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <ThemedView style={[styles.container, isDark && styles.containerDark]}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => onToggle(task)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkboxInner,
            task.completed && styles.checkboxChecked,
            isDark && !task.completed && styles.checkboxDark,
          ]}
        >
          {task.completed && <ThemedText style={styles.checkmark}>✓</ThemedText>}
        </View>
      </TouchableOpacity>

      <View style={styles.content}>
        <ThemedText
          type="defaultSemiBold"
          style={[
            styles.title,
            task.completed && styles.titleCompleted,
          ]}
        >
          {task.title}
        </ThemedText>
        
        {task.description && (
          <ThemedText
            style={[
              styles.description,
              task.completed && styles.descriptionCompleted,
            ]}
            numberOfLines={2}
          >
            {task.description}
          </ThemedText>
        )}
        
        <ThemedText style={styles.timestamp}>
          {formatDate(task.createdAt)}
        </ThemedText>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
        activeOpacity={0.7}
      >
        <ThemedText style={styles.deleteIcon}>🗑️</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  containerDark: {
    backgroundColor: '#2a2a2a',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDark: {
    borderColor: '#6ba3ff',
  },
  checkboxChecked: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
  },
  descriptionCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteIcon: {
    fontSize: 20,
  },
});
