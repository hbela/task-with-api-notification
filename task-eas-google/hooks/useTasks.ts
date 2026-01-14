import { tasksApi } from '@/lib/api/tasks';
import { notificationService } from '@/lib/notifications';
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
      // 1. Create task in backend
      const newTask = await tasksApi.create(data);
      
      // 2. Schedule notifications if due date exists
      if (newTask.dueDate) {
        const dueDate = new Date(newTask.dueDate);
        await notificationService.scheduleTaskReminder({
          id: newTask.id,
          title: newTask.title,
          dueDate,
          reminderTimes: data.reminderTimes,
        });
      }

      // 3. Add new task to the beginning of the list
      setTasks(prev => [newTask, ...prev]);
      
      // 4. Update total count
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
      // 1. Update task in backend
      const updatedTask = await tasksApi.update(id, data);
      
      // 2. Handle notifications if due date changed or removed
      if (data.dueDate !== undefined) {
        if (data.dueDate === null || !updatedTask.dueDate) {
          // Due date removed, cancel notifications
          await notificationService.cancelTaskReminders(id);
        } else {
          // Due date changed, reschedule notifications
          const dueDate = new Date(updatedTask.dueDate);
          await notificationService.rescheduleTaskReminders({
            id: updatedTask.id,
            title: updatedTask.title,
            dueDate,
            reminderTimes: data.reminderTimes || updatedTask.reminderTimes || undefined,
          });
        }
      } else if (data.reminderTimes && updatedTask.dueDate) {
        // Only reminder times changed, reschedule
        const dueDate = new Date(updatedTask.dueDate);
        await notificationService.rescheduleTaskReminders({
          id: updatedTask.id,
          title: updatedTask.title,
          dueDate,
          reminderTimes: data.reminderTimes,
        });
      }
      
      // 3. Update task in the list
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
      // 1. Cancel notifications
      await notificationService.cancelTaskReminders(id);
      
      // 2. Delete from backend
      await tasksApi.delete(id);
      
      // 3. Remove task from the list
      setTasks(prev => prev.filter(task => task.id !== id));
      
      // 4. Update total count
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
