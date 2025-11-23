import { describe, expect, it } from 'vitest';
import { createTask, filterTasks, getDefaultFilter, getTaskInsights } from '@/utils/taskUtils';
import type { Task } from '@/types/task';

const sampleTasks: Task[] = [
  {
    id: '1',
    title: 'Reunião',
    category: 'Trabalho',
    status: 'backlog',
    priority: 'high',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Academia',
    category: 'Saúde',
    status: 'done',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

describe('task utils', () => {
  it('creates a task with sane defaults', () => {
    const task = createTask({ title: 'Comprar frutas' });
    expect(task.id).toBeDefined();
    expect(task.status).toBe('backlog');
    expect(task.priority).toBe('medium');
    expect(task.createdAt).toBeTruthy();
  });

  it('filters tasks by status and category', () => {
    const filter = { ...getDefaultFilter(), status: 'done', category: 'Saúde' as const };
    const result = filterTasks(sampleTasks, filter);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('calculates insights', () => {
    const insights = getTaskInsights(sampleTasks);
    expect(insights.total).toBe(2);
    expect(insights.completed).toBe(1);
    expect(insights.active).toBe(1);
  });
});
