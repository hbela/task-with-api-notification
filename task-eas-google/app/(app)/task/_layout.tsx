import { useTranslation } from '@/hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { TouchableOpacity } from 'react-native';

export default function TaskLayout() {
  const router = useRouter();
  const { t, _key } = useTranslation();
  
  // State for screen titles to force updates
  const [screenTitles, setScreenTitles] = useState({
    details: t('tasks.taskDetails'),
    edit: t('tasks.editTask'),
  });

  // Update titles when language changes
  useEffect(() => {
    setScreenTitles({
      details: t('tasks.taskDetails'),
      edit: t('tasks.editTask'),
    });
  }, [_key, t]);

  const BackButton = () => (
    <TouchableOpacity
      onPress={() => router.push('/(app)')}
      style={{ marginLeft: 8 }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="arrow-back" size={24} color="#007AFF" />
    </TouchableOpacity>
  );

  const detailsOptions = useMemo(() => ({
    title: screenTitles.details,
    headerShown: true,
    headerLeft: () => <BackButton />,
  }), [screenTitles.details]);

  const editOptions = useMemo(() => ({
    title: screenTitles.edit,
    headerShown: true,
    headerLeft: () => <BackButton />,
  }), [screenTitles.edit]);

  return (
    <Stack
      screenOptions={{
        headerLeft: () => null, // Override parent's headerLeft
      }}
    >
      <Stack.Screen
        name="[id]"
        options={detailsOptions}
      />
      <Stack.Screen
        name="edit/[id]"
        options={editOptions}
      />
    </Stack>
  );
}
