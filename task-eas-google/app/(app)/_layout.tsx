import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/lib/auth';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { t, _key } = useTranslation();
  
  // State for tab titles to force updates
  const [tabTitles, setTabTitles] = useState({
    tasks: t('tasks.title'),
    create: t('tasks.create'),
    profile: t('settings.profile'),
    settings: t('settings.title'),
  });

  // Update tab titles when language changes
  useEffect(() => {
    setTabTitles({
      tasks: t('tasks.title'),
      create: t('tasks.create'),
      profile: t('settings.profile'),
      settings: t('settings.title'),
    });
    console.log('[AppLayout] Updated tab titles:', {
      tasks: t('tasks.title'),
      create: t('tasks.create'),
      profile: t('settings.profile'),
      settings: t('settings.title'),
    });
  }, [_key, t]);

  const handleLogout = async () => {
    Alert.alert(
      t('auth.logout'),
      t('auth.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert(t('common.error'), t('errors.logoutFailed'));
            }
          }
        }
      ]
    );
  };

  // Memoize options to ensure they update when language changes
  const indexOptions = useMemo(() => ({
    title: tabTitles.tasks,
    headerShown: false,
    tabBarIcon: ({ color, size }: any) => (
      <Ionicons name="list" size={size} color={color} />
    ),
  }), [tabTitles.tasks]);

  const createOptions = useMemo(() => ({
    title: tabTitles.create,
    tabBarIcon: ({ color, size }: any) => (
      <Ionicons name="add-circle" size={size} color={color} />
    ),
  }), [tabTitles.create]);

  const profileOptions = useMemo(() => ({
    title: tabTitles.profile,
    tabBarIcon: ({ color, size }: any) => (
      <Ionicons name="person" size={size} color={color} />
    ),
  }), [tabTitles.profile]);

  const settingsOptions = useMemo(() => ({
    title: tabTitles.settings,
    tabBarIcon: ({ color, size }: any) => (
      <Ionicons name="settings" size={size} color={color} />
    ),
  }), [tabTitles.settings]);

  const screenOptions = useMemo(() => ({
    tabBarActiveTintColor: '#007AFF',
    tabBarInactiveTintColor: '#8E8E93',
    headerStyle: {
      backgroundColor: '#F5F5F7',
    },
    headerTitleStyle: {
      fontWeight: '600' as const,
    },
    headerRight: () => (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 15 }}>
        <Text style={{ fontSize: 14, color: '#666' }}>
          Hi, {user?.name?.split(' ')[0] || 'User'}
        </Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    ),
  }), [user, handleLogout]);

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="index" options={indexOptions} />
      <Tabs.Screen name="create" options={createOptions} />
      <Tabs.Screen name="profile" options={profileOptions} />
      <Tabs.Screen name="settings" options={settingsOptions} />
      <Tabs.Screen name="notification-qa" options={{ href: null }} />
      <Tabs.Screen name="contacts" options={{ href: null }} />
      <Tabs.Screen name="task" options={{ href: null, title: '' }} />
    </Tabs>
  );
}
