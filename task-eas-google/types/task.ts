export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: TaskPriority;
  userId: number;
  dueDate: string | null;
  notificationId: string | null;
  reminderTimes: number[] | null; // Minutes before due date
  contactId: string | null;
  contact?: {
    id: number;
    fullName: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  } | null;
  taskAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  completed?: boolean;
  priority?: TaskPriority;
  dueDate?: string;
  reminderTimes?: number[]; // Minutes before due date
  contactId?: string;
  taskAddress?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  completed?: boolean;
}

export interface TasksResponse {
  tasks: Task[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TaskResponse {
  task: Task;
}
