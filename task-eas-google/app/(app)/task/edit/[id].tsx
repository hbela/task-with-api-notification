import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/LoadingSpinner';
import TaskForm from '@/components/TaskForm';
import { useTask, useUpdateTask } from '@/hooks/useTasksQuery';
import { UpdateTaskInput } from '@/types/task';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
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
        'Success',
        'Task updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(app)')
          }
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to update task. Please try again.'
      );
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading task..." />;
  }

  if (error || !task) {
    return (
      <ErrorMessage
        message={error?.message || 'Task not found'}
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
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel="Update Task"
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
