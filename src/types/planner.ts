import type { Task } from './task';

export interface PlannerCategory {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  dueDate?: string;
  progress: number; // 0-1
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryId?: PlannerCategory['id'];
  categoryColor?: string;
  color: string;
  startDate?: string;
  dueDate?: string;
  tags?: string[];
  progress: number; // 0-1
  priority?: Task['priority'];
  milestones: Milestone[];
  linkedTasks: Task['id'][];
}

export type ScheduleEventKind = 'event' | 'reminder';

export interface ScheduleEvent {
  id: string;
  kind: ScheduleEventKind;
  title: string;
  description?: string;
  date: string; // ISO date
  start?: string; // hh:mm
  end?: string;
  color: string;
  reminderNote?: string;
  tags?: string[];
  linkedGoalId?: Goal['id'];
  linkedTaskId?: Task['id'];
}

export interface CalendarMark {
  id: string;
  date: string; // ISO date
  color: string;
  label: string;
}

export interface PlannerNote {
  id: string;
  title: string;
  content: string;
  color: string;
  tags?: string[];
  goalId?: Goal['id'];
  updatedAt: string;
}



export type PlannerSection = 'tasks' | 'goals' | 'calendar' | 'insights' | 'notes';
