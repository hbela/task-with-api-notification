import AuthGuard from '@/components/AuthGuard';
import TaskForm from '@/components/TaskForm';
import { useCreateTask } from '@/hooks/useTasksQuery';
import { useTranslation } from '@/hooks/useTranslation';
import { CreateTaskInput, UpdateTaskInput } from '@/types/task';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function CreateTaskScreen() {
  const router = useRouter();
  const createTaskMutation = useCreateTask();
  const { t } = useTranslation();

  const handleSubmit = async (data: CreateTaskInput | UpdateTaskInput) => {
    try {
      await createTaskMutation.mutateAsync(data as CreateTaskInput);
      
      Alert.alert(
        t('common.success'),
        t('tasks.createSuccess'),
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
        error.message || t('errors.createTask')
      );
    }
  };

  return (
    <AuthGuard>
      <View style={styles.container}>
        <TaskForm
          onSubmit={handleSubmit}
          submitLabel={t('tasks.createTask')}
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
