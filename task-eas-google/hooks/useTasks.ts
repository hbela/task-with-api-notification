import { tasksApi } from '@/lib/api/tasks';
import { PaginationParams } from '@/types/api';
import { CreateTaskInput, Task, UpdateTaskInput } from '@/types/task';
import { useCallback, useState } from 'react';

interface UseTasksReturnType {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  fetchTasks: (params?: PaginationParams & { refresh?: boolean }) => Promise<void>;
  createTask: (data: CreateTaskInput) => Promise<Task>;
  updateTask: (id: number, data: UpdateTaskInput) => Promise<Task>;
  deleteTask: (id: number) => Promise<void>;
  toggleTaskComplete: (id: number, completed: boolean) => Promise<void>;
  setError: (error: string | null) => void;
  clearTasks: () => void;
}

export const useTasks = (): UseTasksReturnType => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true
  });

  /**
   * Fetch tasks with pagination and filtering
   */
  const fetchTasks = useCallback(async (params?: PaginationParams & { refresh?: boolean }) => {
    const page = params?.page || pagination.page;
    const limit = params?.limit || pagination.limit;
    
    // Don't fetch if no more data and not refreshing
    if (!params?.refresh && !pagination.hasMore && page > 1) return;

    setLoading(true);
    setError(null);

    try {
      const response = await tasksApi.getAll({
        page,
        limit,
        status: params?.status
      });

      setTasks(prev => {
        // If refreshing or first page, replace all tasks
        if (params?.refresh || page === 1) {
          return response.tasks;
        }
        // Otherwise, append to existing tasks
        return [...prev, ...response.tasks];
      });

      // Update pagination metadata
      if (response.meta) {
        setPagination({
          page: response.meta.page,
          limit: response.meta.limit,
          total: response.meta.total,
          hasMore: response.meta.page * response.meta.limit < response.meta.total
        });
      } else {
        // If no meta, assume no more data
        setPagination(prev => ({
          ...prev,
          page,
          hasMore: false
        }));
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch tasks';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [pagination]);

  /**
   * Create a new task
   */
  const createTask = useCallback(async (data: CreateTaskInput): Promise<Task> => {
    setLoading(true);
    setError(null);

    try {
      const newTask = await tasksApi.create(data);
      
      // Add new task to the beginning of the list
      setTasks(prev => [newTask, ...prev]);
      
      // Update total count
      setPagination(prev => ({
        ...prev,
        total: prev.total + 1
      }));

      return newTask;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create task';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update an existing task
   */
  const updateTask = useCallback(async (id: number, data: UpdateTaskInput): Promise<Task> => {
    setLoading(true);
    setError(null);

    try {
      const updatedTask = await tasksApi.update(id, data);
      
      // Update task in the list
      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updatedTask } : task
      ));

      return updatedTask;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update task';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a task
   */
  const deleteTask = useCallback(async (id: number): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await tasksApi.delete(id);
      
      // Remove task from the list
      setTasks(prev => prev.filter(task => task.id !== id));
      
      // Update total count
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }));
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete task';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Toggle task completion status
   */
  const toggleTaskComplete = useCallback(async (id: number, completed: boolean): Promise<void> => {
    try {
      await tasksApi.toggleComplete(id, completed);
      
      // Update task in the list optimistically
      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, completed, updatedAt: new Date().toISOString() } : task
      ));
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Clear all tasks (useful for logout)
   */
  const clearTasks = useCallback(() => {
    setTasks([]);
    setPagination({
      page: 1,
      limit: 20,
      total: 0,
      hasMore: true
    });
    setError(null);
  }, []);

  return {
    tasks,
    loading,
    error,
    pagination,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    setError,
    clearTasks
  };
};
