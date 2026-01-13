import AuthGuard from '@/components/AuthGuard';
import TaskForm from '@/components/TaskForm';
import { useCreateTask } from '@/hooks/useTasksQuery';
import { CreateTaskInput, UpdateTaskInput } from '@/types/task';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function CreateTaskScreen() {
  const router = useRouter();
  const createTaskMutation = useCreateTask();

  const handleSubmit = async (data: CreateTaskInput | UpdateTaskInput) => {
    try {
      await createTaskMutation.mutateAsync(data as CreateTaskInput);
      
      Alert.alert(
        'Success',
        'Task created successfully!',
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
        error.message || 'Failed to create task. Please try again.'
      );
    }
  };

  return (
    <AuthGuard>
      <View style={styles.container}>
        <TaskForm
          onSubmit={handleSubmit}
          submitLabel="Create Task"
          loading={createTaskMutation.isPending}
        />
      </View>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
});
