import LoadingSpinner from '@/components/LoadingSpinner';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider, useAuth } from '@/lib/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
  offlineAccess: true,
});

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
    },
  },
});

function RootLayoutNav() {
  const { user, isLoading, initialized } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Initialize notifications
  useEffect(() => {
    const initNotifications = async () => {
      try {
        const { notificationService } = await import('@/lib/notifications');
        await notificationService.initialize();
        
        // Schedule daily summary at 9 AM
        await notificationService.scheduleDailySummary(9);
        
        console.log('Notifications initialized successfully');
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initNotifications();
  }, []);

  // Handle notification taps
  useEffect(() => {
    const setupNotificationHandler = async () => {
      try {
        const { notificationService } = await import('@/lib/notifications');
        
        const subscription = notificationService.setupNotificationListener((taskId) => {
          console.log('Notification tapped for task:', taskId);
          // Navigate to task detail or task list
          router.push('/(app)');
        });

        return () => {
          subscription.remove();
        };
      } catch (error) {
        console.error('Failed to setup notification handler:', error);
      }
    };

    setupNotificationHandler();
  }, [router]);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (user && !inAppGroup) {
      // Redirect to app if authenticated
      router.replace('/(app)');
    }
  }, [user, segments, initialized]);

  if (isLoading || !initialized) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}
