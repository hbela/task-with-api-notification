import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/LoadingSpinner';
import { tasksApi } from '@/lib/api/tasks';
import { Task } from '@/types/task';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    try {
      setLoading(true);
      setError(null);
      const taskData = await tasksApi.getById(Number(id));
      setTask(taskData);
    } catch (err: any) {
      setError(err.message || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await tasksApi.delete(Number(id));
              router.back();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete task');
            }
          }
        }
      ]
    );
  };

  const handleToggleComplete = async () => {
    if (!task) return;
    try {
      const updatedTask = await tasksApi.toggleComplete(task.id, !task.completed);
      setTask(updatedTask);
    } catch (err) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading task..." />;
  }

  if (error || !task) {
    return (
      <ErrorMessage
        message={error || 'Task not found'}
        onRetry={loadTask}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity
            style={styles.completionIndicator}
            onPress={handleToggleComplete}
          >
            <Ionicons
              name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
              size={32}
              color={task.completed ? '#34C759' : '#C7C7CC'}
            />
          </TouchableOpacity>
          <Text style={[styles.title, task.completed && styles.completedTitle]}>
            {task.title}
          </Text>
        </View>
        
        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
            <Text style={styles.metadataText}>
              Created: {new Date(task.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </View>
          
          {task.updatedAt !== task.createdAt && (
            <View style={styles.metadataItem}>
              <Ionicons name="time-outline" size={16} color="#8E8E93" />
              <Text style={styles.metadataText}>
                Updated: {new Date(task.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statusBadge}>
          <Text style={[
            styles.statusText,
            task.completed ? styles.statusCompleted : styles.statusPending
          ]}>
            {task.completed ? 'Completed' : 'Pending'}
          </Text>
        </View>
      </View>

      {task.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{task.description}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => router.push(`/(app)/task/edit/${id}`)}
        >
          <Ionicons name="pencil" size={20} color="white" />
          <Text style={styles.actionText}>Edit Task</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.toggleButton]}
          onPress={handleToggleComplete}
        >
          <Ionicons
            name={task.completed ? 'close-circle' : 'checkmark-circle'}
            size={20}
            color="white"
          />
          <Text style={styles.actionText}>
            {task.completed ? 'Mark as Pending' : 'Mark as Complete'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={20} color="white" />
          <Text style={styles.actionText}>Delete Task</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  completionIndicator: {
    marginRight: 12,
    marginTop: 2,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    lineHeight: 32,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  metadata: {
    gap: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metadataText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statusBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#E8F5E9',
    color: '#34C759',
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
    color: '#FF9500',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1C1C1E',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3C3C43',
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  toggleButton: {
    backgroundColor: '#34C759',
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
