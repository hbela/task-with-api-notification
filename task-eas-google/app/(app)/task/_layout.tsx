import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function TaskLayout() {
  const router = useRouter();

  const BackButton = () => (
    <TouchableOpacity
      onPress={() => router.push('/(app)')}
      style={{ marginLeft: 8 }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="arrow-back" size={24} color="#007AFF" />
    </TouchableOpacity>
  );

  return (
    <Stack
      screenOptions={{
        headerLeft: () => null, // Override parent's headerLeft
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Task Details',
          headerShown: true,
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: 'Edit Task',
          headerShown: true,
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack>
  );
}
