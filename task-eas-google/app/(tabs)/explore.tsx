import { CreateTaskModal } from '@/components/create-task-modal';
import { TaskItem } from '@/components/task-item';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { taskApi, type Task } from '@/lib/api';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const colorScheme = useColorScheme();

  const isDark = colorScheme === 'dark';

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const { tasks: fetchedTasks } = await taskApi.getTasks();
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      Alert.alert('Error', 'Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadTasks();
  }, []);

  const handleCreateTask = async (title: string, description: string) => {
    try {
      const { task } = await taskApi.createTask({
        title,
        description: description || undefined,
      });
      
      // Add new task to the beginning of the list
      setTasks([task, ...tasks]);
      
      Alert.alert('Success', 'Task created successfully!');
    } catch (error: any) {
      console.error('Failed to create task:', error);
      Alert.alert('Error', error.message || 'Failed to create task');
      throw error; // Re-throw to prevent modal from closing
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const { task: updatedTask } = await taskApi.toggleTask(task);
      
      // Update task in list
      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    } catch (error: any) {
      console.error('Failed to toggle task:', error);
      Alert.alert('Error', error.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (task: Task) => {
    try {
      await taskApi.deleteTask(task.id);
      
      // Remove task from list
      setTasks(tasks.filter(t => t.id !== task.id));
      
      Alert.alert('Success', 'Task deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete task:', error);
      Alert.alert('Error', error.message || 'Failed to delete task');
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <ThemedText style={styles.emptyIcon}>📝</ThemedText>
      <ThemedText type="title" style={styles.emptyTitle}>
        No tasks yet
      </ThemedText>
      <ThemedText style={styles.emptyText}>
        Tap the + button below to create your first task
      </ThemedText>
    </View>
  );

  const renderHeader = () => {
    const completedCount = tasks.filter(t => t.completed).length;
    const totalCount = tasks.length;

    return (
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          My Tasks
        </ThemedText>
        {totalCount > 0 && (
          <ThemedText style={styles.headerSubtitle}>
            {completedCount} of {totalCount} completed
          </ThemedText>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <ThemedText style={styles.loadingText}>Loading tasks...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {renderHeader()}

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onToggle={handleToggleTask}
            onDelete={handleDeleteTask}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          tasks.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4285F4"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, isDark && styles.fabDark]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <ThemedText style={styles.fabIcon}>+</ThemedText>
      </TouchableOpacity>

      {/* Create Task Modal */}
      <CreateTaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreateTask}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.6,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 100, // Space for FAB
  },
  listContentEmpty: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabDark: {
    backgroundColor: '#6ba3ff',
  },
  fabIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
});
