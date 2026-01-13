import {
    logout as apiLogout,
    getCurrentUser,
    isAuthenticated,
    loginWithGoogle
} from '@/lib/api/auth';
import { User } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Direct storage methods to avoid circular dependency
const storageHelpers = {
  async getUser(): Promise<User | null> {
    const userString = await AsyncStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  },
  
  async setUser(user: User): Promise<void> {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  },
  
  async clearTokens(): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    } else {
      await SecureStore.deleteItemAsync('accessToken').catch(() => {});
      await SecureStore.deleteItemAsync('refreshToken').catch(() => {});
      await AsyncStorage.removeItem('user');
    }
  }
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  initialized: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const isLoggingIn = React.useRef(false);
  const hasCheckedAuth = React.useRef(false);

  // Debug: Log user state changes
  useEffect(() => {
    console.log('[Auth] User state changed:', user ? user.email : 'null');
  }, [user]);

  /**
   * Check authentication state on app load
   */
  const checkAuthState = React.useCallback(async () => {
    // Only check once on mount, or skip if logging in
    if (hasCheckedAuth.current || isLoggingIn.current) {
      console.log('[Auth] Skipping checkAuthState - already checked or login in progress');
      return;
    }

    hasCheckedAuth.current = true;

    try {
      console.log('[Auth] Checking auth state...');
      setIsLoading(true);
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        // Try to get user from storage first
        const cachedUser = await storageHelpers.getUser();
        if (cachedUser) {
          console.log('[Auth] Found cached user:', cachedUser.email);
          setUser(cachedUser);
        }
        
        // Then fetch fresh user data
        try {
          const userData = await getCurrentUser();
          console.log('[Auth] Fetched fresh user data:', userData.email);
          setUser(userData);
          await storageHelpers.setUser(userData);
        } catch (error) {
          console.error('Error fetching user data:', error);
          // If fetching user fails, use cached data or logout
          if (!cachedUser) {
            try {
              await storageHelpers.clearTokens();
            } catch (clearError) {
              console.error('Error clearing tokens:', clearError);
            }
            setUser(null);
          }
        }
      } else {
        console.log('[Auth] Not authenticated');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      try {
        await storageHelpers.clearTokens();
      } catch (clearError) {
        console.error('Error clearing tokens:', clearError);
      }
      setUser(null);
    } finally {
      setIsLoading(false);
      setInitialized(true);
      console.log('[Auth] Auth check complete');
    }
  }, []);

  // Run checkAuthState once on mount
  useEffect(() => {
    console.log('[Auth] Mount - scheduling checkAuthState');
    // Small delay to ensure everything is initialized
    const timer = setTimeout(() => {
      checkAuthState();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  /**
   * Handle user login
   */
  const handleLogin = async () => {
    console.log('[Auth] Starting login...');
    isLoggingIn.current = true;
    setIsLoading(true);
    try {
      const userData = await loginWithGoogle();
      console.log('[Auth] Login successful, setting user:', userData.email);
      
      // Set user and ensure initialized is true
      setUser(userData);
      setInitialized(true);
      await storageHelpers.setUser(userData);
      
      console.log('[Auth] User state updated');
    } catch (error: any) {
      console.error('[Auth] Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
      isLoggingIn.current = false;
      console.log('[Auth] Login process complete');
    }
  };

  /**
   * Handle user logout
   */
  const handleLogout = async () => {
    console.log('[Auth] Starting logout...');
    setIsLoading(true);
    try {
      console.log('[Auth] Calling API logout...');
      await apiLogout();
      console.log('[Auth] API logout complete, clearing user state...');
      setUser(null);
      console.log('[Auth] User state cleared');
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      // Even if logout fails, clear local state
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
      console.log('[Auth] Logout process complete');
    }
  };

  /**
   * Update user data locally
   */
  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  /**
   * Refresh user data from server
   */
  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      await storageHelpers.setUser(userData);
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      initialized,
      login: handleLogin,
      logout: handleLogout,
      updateUser,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
