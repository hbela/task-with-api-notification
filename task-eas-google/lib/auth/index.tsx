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

// Direct storage methods
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

  // Check auth state ONCE on mount
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
        console.log('[Auth] Initializing...');
        
        // Check if we have tokens
        const authenticated = await isAuthenticated();
        
        if (authenticated && mounted) {
          // Get cached user
          const cachedUser = await storageHelpers.getUser();
          if (cachedUser && mounted) {
            console.log('[Auth] Loaded user from cache:', cachedUser.email);
            setUser(cachedUser);
          }
        }
      } catch (error) {
        console.error('[Auth] Init error:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setInitialized(true);
          console.log('[Auth] Initialization complete');
        }
      }
    };

    init();
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = async () => {
    console.log('[Auth] Login started');
    try {
      const userData = await loginWithGoogle();
      console.log('[Auth] Login successful:', userData.email);
      
      await storageHelpers.setUser(userData);
      setUser(userData);
      setInitialized(true);
      
      console.log('[Auth] User state set');
    } catch (error: any) {
      console.error('[Auth] Login failed:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    console.log('[Auth] Logout started');
    try {
      await apiLogout();
      await storageHelpers.clearTokens();
      setUser(null);
      console.log('[Auth] Logout complete');
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      // Clear local state anyway
      await storageHelpers.clearTokens();
      setUser(null);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      await storageHelpers.setUser(userData);
    } catch (error) {
      console.error('[Auth] Refresh user error:', error);
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
