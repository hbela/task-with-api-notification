import { useAuth } from '@/lib/auth';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LoadingSpinner from './LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Auth Guard Component
 * Protects routes from unauthenticated access
 */
export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, isLoading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !user) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    }
  }, [user, initialized]);

  if (isLoading || !initialized) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!user) {
    return fallback || (
      <View style={styles.container}>
        <Text style={styles.text}>Please sign in to continue</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
  },
  text: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
