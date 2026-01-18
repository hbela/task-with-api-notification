import { Task } from '@/types/task';

/**
 * Check if a task is overdue
 * A task is overdue if it has a due date in the past and is not completed
 */
export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.completed) {
    return false;
  }
  
  const dueDate = new Date(task.dueDate);
  return dueDate.getTime() < Date.now();
}

/**
 * Get task status
 */
export function getTaskStatus(task: Task): 'completed' | 'overdue' | 'pending' {
  if (task.completed) {
    return 'completed';
  }
  
  if (isTaskOverdue(task)) {
    return 'overdue';
  }
  
  return 'pending';
}

/**
 * Get status color
 */
export function getStatusColor(status: 'completed' | 'overdue' | 'pending'): string {
  switch (status) {
    case 'completed':
      return '#34C759'; // Green
    case 'overdue':
      return '#FF3B30'; // Red
    case 'pending':
      return '#007AFF'; // Blue
  }
}

/**
 * Get status label
 */
export function getStatusLabel(
  status: 'completed' | 'overdue' | 'pending',
  t?: (key: string) => string
): string {
  // If translation function is provided, use it
  if (t) {
    switch (status) {
      case 'completed':
        return t('tasks.completed');
      case 'overdue':
        return t('tasks.overdue');
      case 'pending':
        return t('tasks.pending');
    }
  }
  
  // Fallback to English
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'overdue':
      return 'Overdue';
    case 'pending':
      return 'Pending';
  }
}
