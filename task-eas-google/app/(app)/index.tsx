import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/LoadingSpinner';
import TaskCard from '@/components/TaskCard';
import { useDeleteTask, useTasks, useToggleTaskComplete } from '@/hooks/useTasksQuery';
import { Task } from '@/types/task';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function TasksScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Fetch tasks with TanStack Query
  const { data, isLoading, error, refetch, isRefetching } = useTasks({
    status: filter === 'all' ? undefined : filter,
  });

  // Mutations
  const deleteTaskMutation = useDeleteTask();
  const toggleCompleteMutation = useToggleTaskComplete();

  const tasks = data?.tasks || [];

  const handleDelete = (task: Task) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTaskMutation.mutateAsync(task.id);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete task');
            }
          }
        }
      ]
    );
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      await toggleCompleteMutation.mutateAsync({
        id: task.id,
        completed: !task.completed,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const renderTask = ({ item }: { item: Task }) => (
    <TaskCard
      task={item}
      onPress={() => router.push(`/(app)/task/${item.id}`)}
      onToggleComplete={() => handleToggleComplete(item)}
    />
  );


  const renderEmpty = () => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="checkmark-done-circle" size={64} color="#ccc" />
        <Text style={styles.emptyText}>
          {searchQuery
            ? 'No tasks match your search'
            : filter === 'completed' 
            ? 'No completed tasks yet'
            : filter === 'pending'
            ? 'No pending tasks'
            : 'No tasks yet. Create your first task!'}
        </Text>
        {!searchQuery && filter === 'all' && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/(app)/create')}
          >
            <Text style={styles.createButtonText}>Create Task</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading tasks..." />;
  }

  if (error && tasks.length === 0) {
    return (
      <ErrorMessage
        message={error.message || 'Failed to load tasks'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Search and Filter Bar */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips */}
        <View style={styles.filterContainer}>
          {(['all', 'pending', 'completed'] as const).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              onPress={() => setFilter(filterType)}
              style={[
                styles.filterChip,
                filter === filterType && styles.filterChipActive
              ]}
            >
              <Text style={[
                styles.filterChipText,
                filter === filterType && styles.filterChipTextActive
              ]}>
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
        }
      />

      {/* Error Banner */}
      {error && tasks.length > 0 && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error.message || 'An error occurred'}</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    color: '#666',
    fontWeight: '400',
  },
  filterChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  createButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footerLoading: {
    padding: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF3B30',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  errorBannerText: {
    flex: 1,
    color: 'white',
    marginRight: 12,
  },
});
