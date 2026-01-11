import { authApi } from '@/lib/api';
import { GoogleSignin, statusCodes, User } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export function GoogleSignInButton() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const router = useRouter();

  const signIn = async () => {
    try {
      setIsSigningIn(true);
      
      // 1. Check if Play Services are available (Android)
      await GoogleSignin.hasPlayServices();
      
      // 2. Prompt user to select Google account
      const user = await GoogleSignin.signIn();
      
      // 3. Get the ID token for backend authentication
      const idToken = user.data?.idToken;
      
      console.log('User Info:', user);
      console.log('ID Token:', idToken);
      
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }
      
      // 4. Authenticate with backend and get JWT token
      console.log('Authenticating with backend...');
      const authResponse = await authApi.loginWithGoogle(idToken);
      console.log('Backend auth successful:', authResponse.user);
      
      setUserInfo(user.data);
      
      // Redirect to tasks/explore page
      router.push('/(tabs)/explore');
      
      Alert.alert(
        'Sign-In Successful!',
        `Welcome ${authResponse.user.name || user.data?.user.name || 'User'}!`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Sign-In Error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the login flow
        Alert.alert('Sign-In Cancelled', 'You cancelled the sign-in process.');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Operation (e.g., sign in) is in progress already
        Alert.alert('Sign-In In Progress', 'Sign-in is already in progress.');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // Play services not available or outdated
        Alert.alert(
          'Play Services Not Available',
          'Google Play Services is not available or outdated on this device.'
        );
      } else {
        // Some other error
        Alert.alert('Sign-In Error', error.message || 'An unknown error occurred.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      setUserInfo(null);
      Alert.alert('Signed Out', 'You have been signed out successfully.');
    } catch (error: any) {
      console.error('Sign-Out Error:', error);
      Alert.alert('Sign-Out Error', error.message || 'Failed to sign out.');
    }
  };

  if (userInfo) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.userInfoContainer}>
          <ThemedText type="subtitle">Signed in as:</ThemedText>
          <ThemedText type="defaultSemiBold">{userInfo.user.name}</ThemedText>
          <ThemedText>{userInfo.user.email}</ThemedText>
        </ThemedView>
        
        <TouchableOpacity
          style={[styles.button, styles.signOutButton]}
          onPress={signOut}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.buttonText}>Sign Out</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity
        style={[styles.button, styles.signInButton]}
        onPress={signIn}
        disabled={isSigningIn}
        activeOpacity={0.8}
      >
        {isSigningIn ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <ThemedText style={styles.buttonText}>🔐 Sign in with Google</ThemedText>
          </>
        )}
      </TouchableOpacity>
      
      <ThemedText style={styles.helpText}>
        Sign in to access your personalized experience
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginVertical: 16,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  signInButton: {
    backgroundColor: '#4285F4', // Google Blue
  },
  signOutButton: {
    backgroundColor: '#EA4335', // Google Red
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 14,
  },
  userInfoContainer: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    gap: 4,
  },
});
