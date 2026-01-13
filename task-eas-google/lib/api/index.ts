import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.204:3001';

class ApiClient {
  private refreshing = false;
  private refreshQueue: Array<{ resolve: (value: string) => void; reject: (reason?: any) => void }> = [];

  /**
   * Get access token from secure storage
   */
  async getAccessToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem('accessToken');
    }
    return SecureStore.getItemAsync('accessToken');
  }

  /**
   * Set access token in secure storage
   */
  async setAccessToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      return AsyncStorage.setItem('accessToken', token);
    }
    return SecureStore.setItemAsync('accessToken', token);
  }

  /**
   * Get refresh token from secure storage
   */
  async getRefreshToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem('refreshToken');
    }
    return SecureStore.getItemAsync('refreshToken');
  }

  /**
   * Set refresh token in secure storage
   */
  async setRefreshToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      return AsyncStorage.setItem('refreshToken', token);
    }
    return SecureStore.setItemAsync('refreshToken', token);
  }

  /**
   * Clear all tokens from storage
   */
  async clearTokens(): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    } else {
      await SecureStore.deleteItemAsync('accessToken').catch(() => {});
      await SecureStore.deleteItemAsync('refreshToken').catch(() => {});
      await AsyncStorage.removeItem('user');
    }
  }

  /**
   * Store user data
   */
  async setUser(user: any): Promise<void> {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Get user data
   */
  async getUser(): Promise<any | null> {
    const userString = await AsyncStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  }

  /**
   * Main request method with automatic token refresh
   */
  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    let accessToken = await this.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...(options.headers as Record<string, string>),
    };

    try {
      const response = await fetch(url, { ...options, headers });

      // Token expired, try to refresh
      if (response.status === 401 && accessToken) {
        const errorData = await response.json().catch(() => ({}));
        
        // Only refresh if it's a token expiration error
        if (errorData.code === 'TOKEN_EXPIRED' || errorData.error?.includes('token')) {
          accessToken = await this.refreshAccessToken();
          headers.Authorization = `Bearer ${accessToken}`;
          
          // Retry with new token
          const retryResponse = await fetch(url, { ...options, headers });
          return this.handleResponse<T>(retryResponse);
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    // If already refreshing, wait in queue
    if (this.refreshing) {
      return new Promise((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject });
      });
    }

    this.refreshing = true;

    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await this.clearTokens();
        throw new Error('Refresh token failed');
      }

      const data = await response.json();
      await this.setAccessToken(data.token);
      
      if (data.refreshToken) {
        await this.setRefreshToken(data.refreshToken);
      }
      
      // Resolve all waiting requests
      this.refreshQueue.forEach(({ resolve }) => resolve(data.token));
      this.refreshQueue = [];
      
      return data.token;
    } catch (error) {
      // Reject all waiting requests
      this.refreshQueue.forEach(({ reject }) => reject(error));
      this.refreshQueue = [];
      throw error;
    } finally {
      this.refreshing = false;
    }
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.error || data.message || 'Request failed',
        data
      };
    }

    return data as T;
  }

  /**
   * GET request
   */
  get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  post<T = any>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  /**
   * PUT request
   */
  put<T = any>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  /**
   * PATCH request
   */
  patch<T = any>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  /**
   * DELETE request
   */
  delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
