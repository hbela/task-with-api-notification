import { tasksApi } from '@/lib/api/tasks';
import { notificationService } from '@/lib/notifications';
import { PaginationParams } from '@/types/api';
import { CreateTaskInput, Task, UpdateTaskInput } from '@/types/task';
import {
    useMutation,
    useQuery,
    useQueryClient
} from '@tanstack/react-query';

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: PaginationParams) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: number) => [...taskKeys.details(), id] as const,
};

/**
 * Hook to fetch tasks with filtering and pagination
 */
export function useTasks(params?: PaginationParams) {
  return useQuery({
    queryKey: taskKeys.list(params || {}),
    queryFn: () => tasksApi.getAll(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch a single task by ID
 */
export function useTask(id: number) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksApi.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTaskInput) => {
      console.log('[useCreateTask] Creating task with data:', data);
      const newTask = await tasksApi.create(data);
      
      // Schedule notifications if due date exists
      if (newTask.dueDate) {
        console.log('[useCreateTask] Task has due date, scheduling notifications...');
        const dueDate = new Date(newTask.dueDate);
        await notificationService.scheduleTaskReminder({
          id: newTask.id,
          title: newTask.title,
          dueDate,
          reminderTimes: data.reminderTimes,
        });
      } else {
        console.log('[useCreateTask] Task has no due date, skipping notifications');
      }
      
      return newTask;
    },
    onSuccess: () => {
      // Invalidate all task lists to refetch
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

/**
 * Hook to update a task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateTaskInput }) => {
      console.log('[useUpdateTask] Updating task:', { id, data });
      const updatedTask = await tasksApi.update(id, data);
      
      // Handle notifications if due date changed or removed
      if (data.dueDate !== undefined) {
        if (data.dueDate === null || !updatedTask.dueDate) {
          // Due date removed, cancel notifications
          console.log('[useUpdateTask] Due date removed, cancelling notifications');
          await notificationService.cancelTaskReminders(id);
        } else {
          // Due date changed, reschedule notifications
          console.log('[useUpdateTask] Due date changed, rescheduling notifications');
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
        console.log('[useUpdateTask] Reminder times changed, rescheduling');
        const dueDate = new Date(updatedTask.dueDate);
        await notificationService.rescheduleTaskReminders({
          id: updatedTask.id,
          title: updatedTask.title,
          dueDate,
          reminderTimes: data.reminderTimes,
        });
      }
      
      return updatedTask;
    },
    onSuccess: (updatedTask) => {
      // Invalidate all task lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      // Update the specific task detail cache
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
    },
  });
}

/**
 * Hook to delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      console.log('[useDeleteTask] Deleting task:', id);
      // Cancel notifications first
      await notificationService.cancelTaskReminders(id);
      // Then delete the task
      return tasksApi.delete(id);
    },
    onSuccess: (_, id) => {
      // Invalidate all task lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      // Remove the specific task detail from cache
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) });
    },
  });
}

/**
 * Hook to toggle task completion
 */
export function useToggleTaskComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      tasksApi.toggleComplete(id, completed),
    onMutate: async ({ id, completed }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueriesData({ queryKey: taskKeys.lists() });

      // Optimistically update all task lists
      queryClient.setQueriesData({ queryKey: taskKeys.lists() }, (old: any) => {
        if (!old?.tasks) return old;
        return {
          ...old,
          tasks: old.tasks.map((task: Task) =>
            task.id === id
              ? { ...task, completed, updatedAt: new Date().toISOString() }
              : task
          ),
        };
      });

      // Return context with previous data for rollback
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
