export type TaskStatus = 'backlog' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  categoryId?: string;
  categoryColor?: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string;
  dueDate?: string;
  tags?: string[];
  goalId?: string;
  subtasks?: TaskSubtask[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilter {
  status: TaskStatus | 'all';
  category: 'all' | string;
  query: string;
  range: 'today' | 'week' | 'all';
}

export interface TaskInsights {
  total: number;
  active: number;
  completed: number;
  overdue: number;
}

export type EditableTaskFields = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>> & {
  startDate?: string | null;
  dueDate?: string | null;
  goalId?: string | null;
  subtasks?: TaskSubtask[] | null;
};
