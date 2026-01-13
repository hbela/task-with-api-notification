import AuthGuard from '@/components/AuthGuard';
import TaskForm from '@/components/TaskForm';
import { useTasks } from '@/hooks/useTasks';
import { CreateTaskInput } from '@/types/task';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function CreateTaskScreen() {
  const router = useRouter();
  const { createTask } = useTasks();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateTaskInput) => {
    setLoading(true);
    try {
      await createTask(data);
      
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <View style={styles.container}>
        <TaskForm
          onSubmit={handleSubmit}
          submitLabel="Create Task"
          loading={loading}
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
