import { PaginationParams } from '@/types/api';
import { CreateTaskInput, Task, TaskResponse, TasksResponse, UpdateTaskInput } from '@/types/task';
import { api } from './index';

/**
 * Task API methods
 */
export const tasksApi = {
  /**
   * Get all tasks with optional pagination and filtering
   */
  getAll: async (params?: PaginationParams): Promise<TasksResponse> => {
    const query = new URLSearchParams();
    
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    
    const queryString = query.toString();
    const endpoint = `/tasks${queryString ? `?${queryString}` : ''}`;
    
    return api.get<TasksResponse>(endpoint);
  },

  /**
   * Get single task by ID
   */
  getById: async (id: number): Promise<Task> => {
    const response = await api.get<TaskResponse>(`/tasks/${id}`);
    return response.task;
  },

  /**
   * Create a new task
   */
  create: async (data: CreateTaskInput): Promise<Task> => {
    const response = await api.post<TaskResponse>('/tasks', data);
    return response.task;
  },

  /**
   * Update an existing task
   */
  update: async (id: number, data: UpdateTaskInput): Promise<Task> => {
    const response = await api.patch<TaskResponse>(`/tasks/${id}`, data);
    return response.task;
  },

  /**
   * Delete a task
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  /**
   * Toggle task completion status
   */
  toggleComplete: async (id: number, completed: boolean): Promise<Task> => {
    const response = await api.patch<TaskResponse>(`/tasks/${id}`, { completed });
    return response.task;
  }
};
