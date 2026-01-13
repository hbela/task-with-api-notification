import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/lib/auth';
import { Redirect } from 'expo-router';

export default function Index() {
  const { user, initialized } = useAuth();

  if (!initialized) {
    return <LoadingSpinner />;
  }

  // Redirect based on authentication state
  if (user) {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
