import { AuthResponse, User } from '@/types/user';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { api } from './index';

/**
 * Login with Google ID token
 */
export async function loginWithGoogle(): Promise<User> {
  try {
    // Check Google Play Services (Android)
    await GoogleSignin.hasPlayServices();
    
    // Sign in with Google
    const signInResult = await GoogleSignin.signIn();
    
    // Extract idToken from the response
    const idToken = signInResult.data?.idToken || (signInResult as any).idToken;

    if (!idToken) {
      throw new Error('No ID token received from Google. Please check your Google Sign-In configuration.');
    }

    console.log('Sending ID token to backend...');
    
    // Send to backend
    const response = await api.post<AuthResponse>('/auth/google', { idToken });
    
    console.log('Backend response received:', {
      hasToken: !!response.token,
      hasRefreshToken: !!response.refreshToken,
      hasUser: !!response.user,
      userEmail: response.user?.email
    });

    // Store tokens
    console.log('Storing access token...');
    await api.setAccessToken(response.token);
    
    console.log('Storing refresh token...');
    await api.setRefreshToken(response.refreshToken);
    
    console.log('Storing user data...');
    await api.setUser(response.user);
    
    console.log('Login complete! User:', response.user.email);

    return response.user;
  } catch (error: any) {
    console.error('Google login error:', error);
    throw new Error(error.message || 'Failed to sign in with Google');
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<User> {
  const response = await api.get<{ user: User }>('/auth/me');
  return response.user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await api.getAccessToken();
  return !!token;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    const refreshToken = await api.getRefreshToken();
    
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken }).catch(err => {
        console.log('Backend logout failed:', err);
      });
    }

    // Revoke Google access - ignore errors if not signed in
    try {
      await GoogleSignin.revokeAccess();
    } catch (revokeError) {
      console.log('Google revoke access skipped:', revokeError);
    }
    
    try {
      await GoogleSignin.signOut();
    } catch (signOutError) {
      console.log('Google sign out skipped:', signOutError);
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local tokens
    await api.clearTokens();
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<string> {
  const refreshToken = await api.getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await api.post<{ token: string; refreshToken: string }>('/auth/refresh', {
    refreshToken
  });

  await api.setAccessToken(response.token);
  
  if (response.refreshToken) {
    await api.setRefreshToken(response.refreshToken);
  }

  return response.token;
}
