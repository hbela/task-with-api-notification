import { isTaskOverdue } from '@/lib/taskUtils';
import { Task } from '@/types/task';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onToggleComplete: () => void;
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return '#FF3B30';
    case 'high':
      return '#FF9500';
    case 'medium':
      return '#007AFF';
    case 'low':
      return '#34C759';
    default:
      return '#8E8E93';
  }
};

export default function TaskCard({
  task,
  onPress,
  onToggleComplete
}: TaskCardProps) {
  const isOverdue = isTaskOverdue(task);
  
  return (
    <TouchableOpacity
      style={[
        styles.card, 
        task.completed && styles.completedCard,
        isOverdue && styles.overdueCard
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Completion Checkbox */}
        <TouchableOpacity
          onPress={onToggleComplete}
          style={styles.checkbox}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={task.completed ? 'checkmark-circle' : (isOverdue ? 'alert-circle' : 'ellipse-outline')}
            size={28}
            color={task.completed ? '#34C759' : (isOverdue ? '#FF3B30' : '#C7C7CC')}
          />
        </TouchableOpacity>

        {/* Task Info */}
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, task.completed && styles.completedTitle]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                {task.priority.toUpperCase()}
              </Text>
            </View>
          </View>
          
          {task.description && (
            <Text
              style={[styles.description, task.completed && styles.completedDescription]}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          )}

          <View style={styles.dateContainer}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={12} color="#8E8E93" />
              <Text style={styles.dateLabel}>Created:</Text>
              <Text style={styles.date}>{formatDateTime(task.createdAt)}</Text>
            </View>
            
            {task.dueDate && (
              <View style={styles.dateRow}>
                <Ionicons 
                  name={isOverdue ? "alert-circle" : "alarm-outline"} 
                  size={12} 
                  color={isOverdue ? "#FF3B30" : "#FF9500"} 
                />
                <Text style={styles.dateLabel}>{isOverdue ? 'Overdue:' : 'Due:'}</Text>
                <Text style={[
                  styles.date, 
                  isOverdue ? styles.overdueDate : styles.dueDate
                ]}>
                  {formatDateTime(task.dueDate)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Right Arrow */}
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" style={styles.arrow} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedCard: {
    opacity: 0.7,
    backgroundColor: '#F9F9F9',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 12,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginRight: 8,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 8,
    lineHeight: 20,
  },
  completedDescription: {
    color: '#8E8E93',
  },
  dateContainer: {
    gap: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  date: {
    fontSize: 11,
    color: '#8E8E93',
  },
  dueDate: {
    color: '#FF9500',
    fontWeight: '500',
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  overdueDate: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  arrow: {
    marginLeft: 8,
  },
});
