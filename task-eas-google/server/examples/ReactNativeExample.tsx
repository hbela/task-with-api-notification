/**
 * Example: Using the Token Manager in React Native
 * 
 * This shows how to integrate the authentication system
 * into your React Native/Expo application.
 */

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Button,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { tokenManager, User } from './tokenManager';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
});

interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const isLoggedIn = await tokenManager.isLoggedIn();
      if (isLoggedIn) {
        const userData = await tokenManager.getUser();
        setUser(userData);
        await loadTasks();
      }
    } catch (error) {
      console.error('Check login error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Google Sign-In
   */
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // 1. Sign in with Google
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const { idToken } = userInfo;

      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // 2. Send to backend
      const userData = await tokenManager.loginWithGoogle(idToken);

      // 3. Update state
      setUser(userData);

      // 4. Load user's tasks
      await loadTasks();

      Alert.alert('Success', `Welcome ${userData.name}!`);
    } catch (error: any) {
      console.error('Sign-in error:', error);
      Alert.alert('Login Failed', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Logout
   */
  const handleLogout = async () => {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      await tokenManager.logout();
      setUser(null);
      setTasks([]);
      Alert.alert('Success', 'Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  /**
   * Load all tasks
   */
  const loadTasks = async () => {
    try {
      const response = await tokenManager.apiCall('/tasks');
      const data = await response.json();
      setTasks(data.tasks);
    } catch (error) {
      console.error('Load tasks error:', error);
      Alert.alert('Error', 'Failed to load tasks');
    }
  };

  /**
   * Create a new task
   */
  const createTask = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    try {
      const response = await tokenManager.apiCall('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDescription,
        }),
      });

      const data = await response.json();
      setTasks([data.task, ...tasks]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      Alert.alert('Success', 'Task created!');
    } catch (error) {
      console.error('Create task error:', error);
      Alert.alert('Error', 'Failed to create task');
    }
  };

  /**
   * Toggle task completion
   */
  const toggleTask = async (task: Task) => {
    try {
      const response = await tokenManager.apiCall(`/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          completed: !task.completed,
        }),
      });

      const data = await response.json();
      setTasks(tasks.map((t) => (t.id === task.id ? data.task : t)));
    } catch (error) {
      console.error('Toggle task error:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  /**
   * Delete a task
   */
  const deleteTask = async (taskId: number) => {
    try {
      await tokenManager.apiCall(`/tasks/${taskId}`, {
        method: 'DELETE',
      });

      setTasks(tasks.filter((t) => t.id !== taskId));
      Alert.alert('Success', 'Task deleted!');
    } catch (error) {
      console.error('Delete task error:', error);
      Alert.alert('Error', 'Failed to delete task');
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Task Manager</Text>
        <Text style={styles.subtitle}>Sign in to manage your tasks</Text>
        <Button title="Sign in with Google" onPress={handleGoogleSignIn} />
      </View>
    );
  }

  // Logged in - Show tasks
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome, {user.name}!</Text>
          <Text style={styles.emailText}>{user.email}</Text>
        </View>
        <Button title="Logout" onPress={handleLogout} />
      </View>

      <View style={styles.createTaskSection}>
        <Text style={styles.sectionTitle}>Create New Task</Text>
        <TextInput
          style={styles.input}
          placeholder="Task title"
          value={newTaskTitle}
          onChangeText={setNewTaskTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Description (optional)"
          value={newTaskDescription}
          onChangeText={setNewTaskDescription}
          multiline
        />
        <Button title="Add Task" onPress={createTask} />
      </View>

      <View style={styles.tasksSection}>
        <Text style={styles.sectionTitle}>
          My Tasks ({tasks.length})
        </Text>
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.taskItem}>
              <View style={styles.taskContent}>
                <Text
                  style={[
                    styles.taskTitle,
                    item.completed && styles.taskCompleted,
                  ]}
                >
                  {item.title}
                </Text>
                {item.description && (
                  <Text style={styles.taskDescription}>
                    {item.description}
                  </Text>
                )}
              </View>
              <View style={styles.taskActions}>
                <Button
                  title={item.completed ? '✓' : '○'}
                  onPress={() => toggleTask(item)}
                />
                <Button
                  title="Delete"
                  onPress={() => deleteTask(item.id)}
                  color="red"
                />
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No tasks yet. Create one above!
            </Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emailText: {
    fontSize: 14,
    color: '#666',
  },
  createTaskSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  tasksSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: 'white',
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
});
