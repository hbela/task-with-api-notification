import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/LoadingSpinner';
import TaskForm from '@/components/TaskForm';
import { tasksApi } from '@/lib/api/tasks';
import { Task, UpdateTaskInput } from '@/types/task';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  const handleSubmit = async (data: UpdateTaskInput) => {
    setSubmitting(true);
    try {
      await tasksApi.update(Number(id), data);
      
      Alert.alert(
        'Success',
        'Task updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to update task. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
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
    <View style={styles.container}>
      <TaskForm
        initialValues={{
          title: task.title,
          description: task.description || undefined,
        }}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel="Update Task"
        loading={submitting}
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
