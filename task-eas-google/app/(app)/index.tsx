import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/LoadingSpinner';
import TaskCard from '@/components/TaskCard';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/types/task';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
  const {
    tasks,
    loading,
    error,
    fetchTasks,
    deleteTask,
    toggleTaskComplete,
    pagination,
    setError
  } = useTasks();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = async (page = 1) => {
    try {
      await fetchTasks({
        page,
        status: filter === 'all' ? undefined : filter,
        refresh: page === 1
      });
    } catch (err) {
      // Error is already set in the hook
    } finally {
      setInitialLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks(1);
    setRefreshing(false);
  };

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
              await deleteTask(task.id);
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
      await toggleTaskComplete(task.id, !task.completed);
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
      onEdit={() => router.push(`/(app)/task/edit/${item.id}`)}
      onDelete={() => handleDelete(item)}
      onToggleComplete={() => handleToggleComplete(item)}
    />
  );

  const renderEmpty = () => {
    if (initialLoading) return null;
    
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

  if (initialLoading) {
    return <LoadingSpinner message="Loading tasks..." />;
  }

  if (error && tasks.length === 0) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => {
          setError(null);
          loadTasks();
        }}
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={() => {
          if (pagination.hasMore && !loading && !searchQuery) {
            loadTasks(pagination.page + 1);
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => {
          if (loading && tasks.length > 0) {
            return (
              <View style={styles.footerLoading}>
                <LoadingSpinner size="small" />
              </View>
            );
          }
          return null;
        }}
      />

      {/* Error Banner */}
      {error && tasks.length > 0 && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
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
