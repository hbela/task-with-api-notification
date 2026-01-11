/**
 * Token Manager for React Native / Expo
 * 
 * This utility handles:
 * - Secure token storage
 * - Automatic token refresh
 * - Authenticated API calls
 * - Token expiry management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

interface User {
  id: number;
  email: string;
  name: string | null;
  avatar: string | null;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class TokenManager {
  private refreshPromise: Promise<string> | null = null;

  /**
   * Platform-specific secure storage
   */
  private async secureSetItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      return AsyncStorage.setItem(key, value);
    } else {
      return SecureStore.setItemAsync(key, value);
    }
  }

  private async secureGetItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    } else {
      return SecureStore.getItemAsync(key);
    }
  }

  private async secureRemoveItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      return AsyncStorage.removeItem(key);
    } else {
      return SecureStore.deleteItemAsync(key);
    }
  }

  /**
   * Store authentication tokens and user data
   */
  async storeTokens(
    accessToken: string,
    refreshToken: string,
    user: User
  ): Promise<void> {
    await this.secureSetItem('accessToken', accessToken);
    await this.secureSetItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await AsyncStorage.setItem('tokenTimestamp', Date.now().toString());
  }

  /**
   * Clear all tokens and user data (logout)
   */
  async clearTokens(): Promise<void> {
    await this.secureRemoveItem('accessToken');
    await this.secureRemoveItem('refreshToken');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('tokenTimestamp');
  }

  /**
   * Get current access token (with auto-refresh if needed)
   */
  async getAccessToken(): Promise<string | null> {
    let accessToken = await this.secureGetItem('accessToken');
    const tokenTimestamp = await AsyncStorage.getItem('tokenTimestamp');

    // Check if token is about to expire (refresh at 14 minutes)
    if (accessToken && tokenTimestamp) {
      const tokenAge = Date.now() - parseInt(tokenTimestamp);
      const tokenMaxAge = 14 * 60 * 1000; // 14 minutes

      if (tokenAge > tokenMaxAge) {
        // Token is old, try to refresh
        try {
          accessToken = await this.refreshAccessToken();
        } catch (error) {
          console.error('Failed to refresh token:', error);
          return null;
        }
      }
    }

    return accessToken;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh calls
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = await this.secureGetItem('refreshToken');

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          // Refresh token is invalid, logout user
          await this.clearTokens();
          throw new Error('Session expired. Please login again.');
        }

        const data = await response.json();

        // Store new tokens
        await this.secureSetItem('accessToken', data.token);
        await this.secureSetItem('refreshToken', data.refreshToken);
        await AsyncStorage.setItem('tokenTimestamp', Date.now().toString());

        return data.token;
      } catch (error) {
        // Clear tokens on refresh failure
        await this.clearTokens();
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Make authenticated API call with automatic token refresh
   */
  async apiCall(url: string, options: RequestInit = {}): Promise<Response> {
    const accessToken = await this.getAccessToken();

    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const defaultHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    let response = await fetch(`${API_BASE_URL}${url}`, config);

    // If token expired, refresh and retry once
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));

      if (errorData.code === 'TOKEN_EXPIRED') {
        const newToken = await this.refreshAccessToken();
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${newToken}`,
        };
        response = await fetch(`${API_BASE_URL}${url}`, config);
      }
    }

    return response;
  }

  /**
   * Get stored user data
   */
  async getUser(): Promise<User | null> {
    const userString = await AsyncStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const accessToken = await this.secureGetItem('accessToken');
    const user = await this.getUser();
    return !!(accessToken && user);
  }

  /**
   * Login with Google ID token
   */
  async loginWithGoogle(idToken: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken,
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Login failed');
    }

    const data = await response.json();

    // Store tokens and user data
    await this.storeTokens(data.token, data.refreshToken, data.user);

    return data.user;
  }

  /**
   * Logout and revoke refresh token
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = await this.secureGetItem('refreshToken');

      if (refreshToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.clearTokens();
    }
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();

// Export types
export type { AuthTokens, User };

