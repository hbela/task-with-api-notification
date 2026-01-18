import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/LoadingSpinner';
import TaskForm from '@/components/TaskForm';
import { useTask, useUpdateTask } from '@/hooks/useTasksQuery';
import { useTranslation } from '@/hooks/useTranslation';
import { UpdateTaskInput } from '@/types/task';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  
  // Fetch task data
  const { data: task, isLoading, error } = useTask(Number(id));
  
  // Update mutation
  const updateTaskMutation = useUpdateTask();

  const handleSubmit = async (data: UpdateTaskInput) => {
    try {
      await updateTaskMutation.mutateAsync({
        id: Number(id),
        data,
      });
      
      Alert.alert(
        t('common.success'),
        t('tasks.updateSuccess'),
        [
          {
            text: t('common.done'),
            onPress: () => router.push('/(app)')
          }
        ]
      );
    } catch (error: any) {
      Alert.alert(
        t('common.error'),
        error.message || t('tasks.updateError')
      );
    }
  };

  const handleCancel = () => {
    router.push('/(app)');
  };

  if (isLoading) {
    return <LoadingSpinner message={t('tasks.loadingTask')} />;
  }

  if (error || !task) {
    return (
      <ErrorMessage
        message={error?.message || t('tasks.taskNotFound')}
        onRetry={() => {}}
      />
    );
  }

  return (
    <View style={styles.container}>
      <TaskForm
        initialValues={{
          title: task.title,
          description: task.description || undefined,
          priority: task.priority,
          dueDate: task.dueDate || undefined,
          reminderTimes: task.reminderTimes || undefined,
          contactId: task.contactId || undefined,
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel={t('tasks.updateTask')}
        loading={updateTaskMutation.isPending}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
});
