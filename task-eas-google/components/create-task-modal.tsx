import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string) => Promise<void>;
}

export function CreateTaskModal({ visible, onClose, onSubmit }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const colorScheme = useColorScheme();

  const isDark = colorScheme === 'dark';

  const handleSubmit = async () => {
    if (!title.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(title.trim(), description.trim());
      // Clear form
      setTitle('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <ThemedView style={[styles.modalContent, isDark && styles.modalContentDark]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <ThemedText type="title" style={styles.headerText}>
                Create New Task
              </ThemedText>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <ThemedText style={styles.closeButtonText}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <ThemedText type="defaultSemiBold" style={styles.label}>
                  Title *
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    isDark ? styles.inputDark : styles.inputLight,
                  ]}
                  placeholder="Enter task title"
                  placeholderTextColor={isDark ? '#999' : '#666'}
                  value={title}
                  onChangeText={setTitle}
                  editable={!isSubmitting}
                  autoFocus
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="defaultSemiBold" style={styles.label}>
                  Description
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    isDark ? styles.inputDark : styles.inputLight,
                  ]}
                  placeholder="Enter task description (optional)"
                  placeholderTextColor={isDark ? '#999' : '#666'}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleClose}
                  disabled={isSubmitting}
                >
                  <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.submitButton,
                    (!title.trim() || isSubmitting) && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!title.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ThemedText style={styles.submitButtonText}>Create Task</ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  modalContentDark: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerText: {
    fontSize: 24,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  inputLight: {
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    color: '#000',
  },
  inputDark: {
    borderColor: '#444',
    backgroundColor: '#2a2a2a',
    color: '#fff',
  },
  textArea: {
    minHeight: 100,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4285F4',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
