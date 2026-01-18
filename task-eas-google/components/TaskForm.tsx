import { useTranslation } from '@/hooks/useTranslation';
import { DEFAULT_REMINDER_OPTIONS, DEFAULT_REMINDERS, getReminderLabel } from '@/lib/notifications';
import { CreateTaskInput, TaskPriority, UpdateTaskInput } from '@/types/task';
import { formatDate, formatTime } from '@/utils/dateFormatter';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import ContactDisplay from './ContactDisplay';
import ContactSearchButton from './ContactSearchButton';


interface TaskFormProps {
  initialValues?: {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string;
    reminderTimes?: number[];
    contactId?: string | null;
  };
  onSubmit: (data: CreateTaskInput | UpdateTaskInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  loading?: boolean;
}


export default function TaskForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
  loading = false
}: TaskFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(initialValues?.priority || 'medium');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    initialValues?.dueDate ? new Date(initialValues.dueDate) : undefined
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [enableReminders, setEnableReminders] = useState(!!initialValues?.dueDate);
  const [reminderTimes, setReminderTimes] = useState<number[]>(
    initialValues?.reminderTimes || DEFAULT_REMINDERS
  );
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    initialValues?.contactId || null
  );
  const [errors, setErrors] = useState<{ title?: string }>({});

  const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case 'urgent': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#007AFF';
      case 'low': return '#34C759';
    }
  };

  const validate = (): boolean => {
    const newErrors: { title?: string } = {};

    if (!title.trim()) {
      newErrors.title = t('form.errors.titleRequired');
    } else if (title.trim().length < 3) {
      newErrors.title = t('form.errors.titleTooShort');
    } else if (title.trim().length > 255) {
      newErrors.title = t('form.errors.titleTooLong');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const data: CreateTaskInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      ...(dueDate && { dueDate: dueDate.toISOString() }),
      ...(dueDate && enableReminders && { reminderTimes }),
      ...(selectedContactId && { contactId: selectedContactId }),
    };

    try {
      await onSubmit(data);
      // Reset form after successful submission
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate(undefined);
      setEnableReminders(false);
      setReminderTimes(DEFAULT_REMINDERS);
      setSelectedContactId(null);
      setErrors({});
    } catch (error) {
      // Error handling is done by parent component
      console.error('[TaskForm] Form submission error:', error);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (dueDate) {
        // Preserve time if it exists
        selectedDate.setHours(dueDate.getHours(), dueDate.getMinutes());
      }
      setDueDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime && dueDate) {
      const newDate = new Date(dueDate);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setDueDate(newDate);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('form.title')} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder={t('form.placeholders.title')}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (errors.title) setErrors({ ...errors, title: undefined });
            }}
            maxLength={255}
            editable={!loading}
          />
          {errors.title && (
            <Text style={styles.errorText}>{errors.title}</Text>
          )}
          <Text style={styles.charCount}>{title.length}/255</Text>
        </View>

        {/* Description Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('tasks.description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t('form.placeholders.description')}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>

        {/* Contact Selector */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('form.contact')}</Text>
          
          {selectedContactId ? (
            <View>
              <ContactDisplay contactId={selectedContactId} showActions={false} />
              <TouchableOpacity
                style={styles.removeContactButton}
                onPress={() => setSelectedContactId(null)}
                disabled={loading}
              >
                <Ionicons name="close-circle" size={20} color="#FF3B30" />
                <Text style={styles.removeContactText}>{t('form.removeContact')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ContactSearchButton
              onContactSelect={(contactId) => setSelectedContactId(contactId)}
              selectedContactId={selectedContactId}
              disabled={loading}
            />
          )}
        </View>

        {/* Priority Selector */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('tasks.priority')}</Text>
          <View style={styles.priorityContainer}>
            {priorities.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityButton,
                  priority === p && { 
                    backgroundColor: getPriorityColor(p),
                    borderColor: getPriorityColor(p)
                  }
                ]}
                onPress={() => setPriority(p)}
                disabled={loading}
              >
                <Text style={[
                  styles.priorityButtonText,
                  priority === p && styles.priorityButtonTextActive
                ]}>
                  {t(`tasks.priorities.${p}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Due Date Selector */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('form.dueDateTime')}</Text>
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
              disabled={loading}
            >
              <Ionicons name="calendar-outline" size={20} color="#007AFF" />
              <Text style={styles.dateTimeButtonText}>
                {dueDate ? formatDate(dueDate, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }) : t('form.selectDate')}
              </Text>
            </TouchableOpacity>

            {dueDate && (
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
                disabled={loading}
              >
                <Ionicons name="time-outline" size={20} color="#007AFF" />
                <Text style={styles.dateTimeButtonText}>
                  {formatTime(dueDate)}
                </Text>
              </TouchableOpacity>
            )}

            {dueDate && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setDueDate(undefined)}
                disabled={loading}
              >
                <Ionicons name="close-circle" size={20} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {showTimePicker && dueDate && (
            <DateTimePicker
              value={dueDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
        </View>

        {/* Reminder Times Selector */}
        {dueDate && (
          <View style={styles.inputGroup}>
            <View style={styles.reminderHeader}>
              <Text style={styles.label}>{t('form.reminders')}</Text>
              <Switch
                value={enableReminders}
                onValueChange={setEnableReminders}
                disabled={loading}
              />
            </View>

            {enableReminders && (
              <View style={styles.reminderOptionsContainer}>
                <Text style={styles.reminderHint}>
                  {t('form.reminderHint')}
                </Text>
                <View style={styles.reminderOptions}>
                  {DEFAULT_REMINDER_OPTIONS.map((minutes) => {
                    const isSelected = reminderTimes.includes(minutes);
                    const label = getReminderLabel(minutes, t);
                    
                    return (
                      <TouchableOpacity
                        key={minutes}
                        style={[
                          styles.reminderOption,
                          isSelected && styles.reminderOptionSelected
                        ]}
                        onPress={() => {
                          if (isSelected) {
                            setReminderTimes(prev => prev.filter(m => m !== minutes));
                          } else {
                            setReminderTimes(prev => [...prev, minutes].sort((a, b) => a - b));
                          }
                        }}
                        disabled={loading}
                      >
                        <Ionicons 
                          name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                          size={20} 
                          color={isSelected ? "#007AFF" : "#8E8E93"} 
                        />
                        <Text style={[
                          styles.reminderOptionText,
                          isSelected && styles.reminderOptionTextSelected
                        ]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {reminderTimes.length === 0 && (
                  <Text style={styles.reminderWarning}>
                    ⚠️ {t('form.reminderWarning')}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? t('common.saving') : (submitLabel || t('common.save'))}
            </Text>
          </TouchableOpacity>

          {onCancel && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1C1C1E',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginTop: 4,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  priorityButtonTextActive: {
    color: 'white',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: 'white',
  },
  dateTimeButtonText: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  clearButton: {
    padding: 8,
  },
  actions: {
    marginTop: 20,
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reminderOptionsContainer: {
    marginTop: 8,
  },
  reminderHint: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  reminderOptions: {
    gap: 8,
  },
  reminderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: 'white',
  },
  reminderOptionSelected: {
    backgroundColor: '#E8F4FF',
    borderColor: '#007AFF',
  },
  reminderOptionText: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  reminderOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  reminderWarning: {
    fontSize: 14,
    color: '#FF9500',
    marginTop: 8,
    textAlign: 'center',
  },
  removeContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFF3F3',
    marginTop: 8,
  },
  removeContactText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
});
