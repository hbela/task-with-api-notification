import { contactsApi } from '@/lib/api/contacts';
// NOTE: This screen is deprecated - contacts are now managed via device only
// import { contactSyncManager } from '@/lib/contacts/contactSyncManager';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isNewContact = id === 'new';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    fullName: '',
    phone: '',
    email: '',
    address: '',
    company: '',
    notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => contactsApi.getById(parseInt(id)),
    enabled: !isNewContact,
  });

  // Update form data when contact is loaded
  useEffect(() => {
    if (data) {
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        fullName: data.fullName,
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        company: data.company || '',
        notes: data.notes || '',
      });
    }
  }, [data]);

  const createMutation = useMutation({
    mutationFn: contactsApi.create,
    onSuccess: async (newContact) => {
      // Device sync is no longer used - contacts are managed via device only
      // const syncResult = await contactSyncManager.syncContactWithDevice({
      //   ...newContact,
      //   id: newContact.id,
      // });

      // if (syncResult.success && syncResult.deviceContactId) {
      //   await contactsApi.updateSyncStatus(newContact.id, {
      //     deviceContactId: syncResult.deviceContactId,
      //     syncStatus: 'synced',
      //   });
      // }

      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      Alert.alert('Success', 'Contact created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create contact');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      contactsApi.update(id, data),
    onSuccess: async (updatedContact) => {
      // Device sync is no longer used - contacts are managed via device only
      // const syncResult = await contactSyncManager.syncContactWithDevice({
      //   ...updatedContact,
      //   id: updatedContact.id,
      // });

      // if (syncResult.success && syncResult.deviceContactId) {
      //   await contactsApi.updateSyncStatus(updatedContact.id, {
      //     deviceContactId: syncResult.deviceContactId,
      //     syncStatus: 'synced',
      //   });
      // }

      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact', id] });
      Alert.alert('Success', 'Contact updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update contact');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: contactsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      Alert.alert('Success', 'Contact deleted successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to delete contact');
    },
  });

  const handleSave = () => {
    // Validation
    if (!formData.fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter a name');
      return;
    }

    // Auto-generate fullName if not provided
    const fullName =
      formData.fullName ||
      `${formData.firstName} ${formData.lastName}`.trim();

    const contactData = {
      ...formData,
      fullName,
    };

    if (isNewContact) {
      createMutation.mutate(contactData);
    } else {
      updateMutation.mutate({ id: parseInt(id), data: contactData });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(parseInt(id)),
        },
      ]
    );
  };

  if (isLoading && !isNewContact) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const contact = data;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isNewContact ? 'New Contact' : 'Edit Contact'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
              placeholder="John Doe"
              placeholderTextColor="#C7C7CC"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(text) =>
                  setFormData({ ...formData, firstName: text })
                }
                placeholder="John"
                placeholderTextColor="#C7C7CC"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(text) =>
                  setFormData({ ...formData, lastName: text })
                }
                placeholder="Doe"
                placeholderTextColor="#C7C7CC"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company</Text>
            <TextInput
              style={styles.input}
              value={formData.company}
              onChangeText={(text) => setFormData({ ...formData, company: text })}
              placeholder="Company Name"
              placeholderTextColor="#C7C7CC"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="+1 234 567 8900"
              placeholderTextColor="#C7C7CC"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="john@example.com"
              placeholderTextColor="#C7C7CC"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="123 Main St, City, State"
              placeholderTextColor="#C7C7CC"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>

          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Add notes about this contact..."
              placeholderTextColor="#C7C7CC"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {!isNewContact && contact && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sync Status</Text>
              <View style={styles.syncStatusCard}>
                <View style={styles.syncStatusRow}>
                  <Text style={styles.syncStatusLabel}>Device Sync:</Text>
                  <View style={styles.syncStatusBadge}>
                    {contact.syncStatus === 'synced' && (
                      <>
                        <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                        <Text style={[styles.syncStatusText, { color: '#34C759' }]}>
                          Synced
                        </Text>
                      </>
                    )}
                    {contact.syncStatus === 'pending' && (
                      <>
                        <Ionicons name="time-outline" size={16} color="#FF9500" />
                        <Text style={[styles.syncStatusText, { color: '#FF9500' }]}>
                          Pending
                        </Text>
                      </>
                    )}
                    {contact.syncStatus === 'error' && (
                      <>
                        <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                        <Text style={[styles.syncStatusText, { color: '#FF3B30' }]}>
                          Error
                        </Text>
                      </>
                    )}
                  </View>
                </View>
                {contact.lastSynced && (
                  <Text style={styles.syncStatusDetail}>
                    Last synced: {new Date(contact.lastSynced).toLocaleString()}
                  </Text>
                )}
              </View>
            </View>

            {contact.tasks && contact.tasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Associated Tasks</Text>
                {contact.tasks.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={styles.taskCard}
                    onPress={() => router.push(`/(app)/task/${task.id}`)}
                  >
                    <View style={styles.taskInfo}>
                      <Ionicons
                        name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={task.completed ? '#34C759' : '#8E8E93'}
                      />
                      <Text
                        style={[
                          styles.taskTitle,
                          task.completed && styles.taskTitleCompleted,
                        ]}
                      >
                        {task.title}
                      </Text>
                    </View>
                    {task.dueDate && (
                      <Text style={styles.taskDueDate}>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={20} color="#FFF" />
                    <Text style={styles.deleteButtonText}>Delete Contact</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  syncStatusCard: {
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    padding: 16,
  },
  syncStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncStatusLabel: {
    fontSize: 16,
    color: '#666',
  },
  syncStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  syncStatusDetail: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
  },
  taskCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  taskDueDate: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingVertical: 14,
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
