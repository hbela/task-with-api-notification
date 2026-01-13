import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/lib/auth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function LoginScreen() {
  const { login, isLoading, user } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace('/(app)');
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    if (signingIn) return; // Prevent double tap
    
    setSigningIn(true);
    try {
      await login();
      // User state will update, triggering the useEffect redirect
      // Don't reset signingIn - let the redirect happen
    } catch (error: any) {
      console.error('Sign-in error:', error);
      Alert.alert(
        'Sign In Failed',
        error.message || 'Failed to sign in with Google. Please try again.',
        [{ text: 'OK' }]
      );
      setSigningIn(false); // Only reset on error
    }
  };

  if (isLoading || signingIn || user) {
    return <LoadingSpinner message="Signing in..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* App Logo/Icon */}
        <View style={styles.logoContainer}>
          <Ionicons name="checkmark-done-circle" size={100} color="#007AFF" />
        </View>

        {/* App Title */}
        <Text style={styles.title}>Task Manager</Text>
        <Text style={styles.subtitle}>
          Organize your tasks efficiently
        </Text>

        {/* Features List */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.featureText}>Create and manage tasks</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="sync" size={24} color="#34C759" />
            <Text style={styles.featureText}>Sync across devices</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="shield-checkmark" size={24} color="#34C759" />
            <Text style={styles.featureText}>Secure with Google</Text>
          </View>
        </View>
      </View>

      {/* Sign In Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={signingIn}
        >
          <Ionicons name="logo-google" size={24} color="white" />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#8E8E93',
    marginBottom: 40,
    textAlign: 'center',
  },
  features: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#3C3C43',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  disclaimer: {
    marginTop: 16,
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 16,
  },
});
