import ContactDisplay from '@/components/ContactDisplay';
import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useDeleteTask, useTask, useToggleTaskComplete } from '@/hooks/useTasksQuery';
import { useTranslation } from '@/hooks/useTranslation';
import { getStatusColor, getStatusLabel, getTaskStatus } from '@/lib/taskUtils';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return '#FF3B30';
    case 'high':
      return '#FF9500';
    case 'medium':
      return '#007AFF';
    case 'low':
      return '#34C759';
    default:
      return '#8E8E93';
  }
};


export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  
  // Fetch task with TanStack Query
  const { data: task, isLoading, error, refetch } = useTask(Number(id));
  
  // Mutations
  const deleteTaskMutation = useDeleteTask();
  const toggleCompleteMutation = useToggleTaskComplete();

  const handleDelete = () => {
    Alert.alert(
      t('tasks.deleteConfirmTitle'),
      t('tasks.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('tasks.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTaskMutation.mutateAsync(Number(id));
              router.push('/(app)');
            } catch (err) {
              Alert.alert(t('common.error'), t('tasks.deleteError'));
            }
          }
        }
      ]
    );
  };

  const handleToggleComplete = async () => {
    if (!task) return;
    try {
      await toggleCompleteMutation.mutateAsync({
        id: task.id,
        completed: !task.completed,
      });
      // Redirect to task list after toggling
      router.push('/(app)');
    } catch (err) {
      Alert.alert(t('common.error'), t('tasks.updateError'));
    }
  };

  if (isLoading) {
    return <LoadingSpinner message={t('tasks.loadingTask')} />;
  }

  if (error || !task) {
    return (
      <ErrorMessage
        message={error?.message || t('tasks.taskNotFound')}
        onRetry={() => refetch()}
      />
    );
  }

  const taskStatus = getTaskStatus(task);
  const statusColor = getStatusColor(taskStatus);
  const statusLabel = getStatusLabel(taskStatus, t);

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
              {t('tasks.created')}: {new Date(task.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </Text>
          </View>
          
          {task.updatedAt !== task.createdAt && (
            <View style={styles.metadataItem}>
              <Ionicons name="time-outline" size={16} color="#8E8E93" />
              <Text style={styles.metadataText}>
                {t('tasks.updated')}: {new Date(task.updatedAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statusBadge}>
          <Text style={[
            styles.statusText,
            { backgroundColor: statusColor + '20', color: statusColor }
          ]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {task.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('tasks.description')}</Text>
          <Text style={styles.description}>{task.description}</Text>
        </View>
      )}

      {/* Priority and Due Date Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('tasks.details')}</Text>
        
        <View style={styles.detailRow}>
          <View style={styles.detailLabel}>
            <Ionicons name="flag-outline" size={18} color="#8E8E93" />
            <Text style={styles.detailLabelText}>{t('tasks.priority')}</Text>
          </View>
          <View style={[
            styles.priorityBadge,
            { backgroundColor: getPriorityColor(task.priority) + '20' }
          ]}>
            <Text style={[
              styles.priorityText,
              { color: getPriorityColor(task.priority) }
            ]}>
              {t(`tasks.priorities.${task.priority}`).toUpperCase()}
            </Text>
          </View>
        </View>

        {task.dueDate && (
          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons name="alarm-outline" size={18} color="#8E8E93" />
              <Text style={styles.detailLabelText}>{t('tasks.dueDate')}</Text>
            </View>
            <Text style={styles.detailValue}>
              {new Date(task.dueDate).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </Text>
          </View>
        )}
      </View>

      {/* Contact Section */}
      {task.contactId && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('tasks.contact')}</Text>
          <ContactDisplay contactId={task.contactId} showActions={true} />
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => router.push(`/(app)/task/edit/${id}`)}
        >
          <Ionicons name="pencil" size={20} color="white" />
          <Text style={styles.actionText}>{t('tasks.editTask')}</Text>
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
            {task.completed ? t('tasks.markPending') : t('tasks.markComplete')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={20} color="white" />
          <Text style={styles.actionText}>{t('tasks.deleteTask')}</Text>
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
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    lineHeight: 24,
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
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1C1C1E',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3C3C43',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabelText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#3C3C43',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
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
