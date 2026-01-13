import { Stack } from 'expo-router';

export default function TaskLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Task Details',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: 'Edit Task',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
