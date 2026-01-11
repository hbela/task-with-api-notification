/**
 * API Client for Task Management
 * Handles all API calls to the backend server
 */

import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Special handling for Android Emulator
  if (Platform.OS === 'android') {
    // Try to reach the specific IP first if provided, otherwise standard emulator IP
    return 'http://192.168.1.204:3001'; 
  }
  
  // Default for iOS / Web
  return 'http://192.168.1.204:3001';
};

const API_BASE_URL = getBaseUrl();

export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  completed?: boolean;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  completed?: boolean;
}

/**
 * Get authentication token from Google Sign-In
 * This should be stored after successful login
 */
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

/**
 * Make authenticated API call
 */
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.details || 'Request failed');
  }

  return response.json();
}

/**
 * Task API Methods
 */
export const taskApi = {
  /**
   * Get all tasks for authenticated user
   */
  async getTasks(): Promise<{ tasks: Task[] }> {
    return apiCall('/tasks');
  },

  /**
   * Get a specific task by ID
   */
  async getTask(id: number): Promise<{ task: Task }> {
    return apiCall(`/tasks/${id}`);
  },

  /**
   * Create a new task
   */
  async createTask(data: CreateTaskRequest): Promise<{ task: Task }> {
    return apiCall('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a task
   */
  async updateTask(id: number, data: UpdateTaskRequest): Promise<{ task: Task }> {
    return apiCall(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a task
   */
  async deleteTask(id: number): Promise<{ message: string }> {
    return apiCall(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Toggle task completion status
   */
  async toggleTask(task: Task): Promise<{ task: Task }> {
    return this.updateTask(task.id, {
      completed: !task.completed,
    });
  },
};

/**
 * Auth API Methods
 */
export const authApi = {
  /**
   * Login with Google ID token
   */
  async loginWithGoogle(idToken: string): Promise<{
    user: any;
    token: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Login failed');
    }

    const data = await response.json();
    
    // Store the token
    setAuthToken(data.token);
    
    return data;
  },

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    return apiCall('/auth/me');
  },

  /**
   * Logout
   */
  async logout(refreshToken: string) {
    await apiCall('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    setAuthToken(null);
  },
};
