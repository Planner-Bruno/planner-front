import { addDays, endOfDay, isAfter, isBefore, isWithinInterval, parseISO, startOfDay } from 'date-fns';
import type { EditableTaskFields, Task, TaskFilter, TaskInsights, TaskPriority, TaskSubtask } from '@/types/task';

const randomSegment = () => Math.random().toString(36).slice(2, 7);

const normalizeTags = (tags?: string[] | null): string[] | undefined => {
  if (!tags) return undefined;
  const cleaned = tags.map((tag) => tag.trim()).filter(Boolean).map((tag) => tag.slice(0, 32));
  return cleaned.length ? cleaned : undefined;
};

const sanitizeSubtasks = (entries?: TaskSubtask[] | null): TaskSubtask[] | undefined => {
  if (!entries?.length) return undefined;
  const normalized = entries
    .map((entry) => {
      const title = entry.title?.trim() ?? '';
      if (!title) return null;
      return {
        id: entry.id ?? `${Date.now().toString(36)}-${randomSegment()}`,
        title,
        completed: Boolean(entry.completed)
      } satisfies TaskSubtask;
    })
    .filter(Boolean) as TaskSubtask[];
  return normalized.length ? normalized : undefined;
};

export const makeSubtask = (title: string): TaskSubtask => ({
  id: `${Date.now().toString(36)}-${randomSegment()}`,
  title: title.trim(),
  completed: false
});

export const createTask = (input: {
  title: string;
  description?: string;
  category?: string;
  categoryId?: string | null;
  categoryColor?: string | null;
  priority?: TaskPriority;
  startDate?: string | null;
  dueDate?: string | null;
  tags?: string[] | null;
  goalId?: string | null;
  subtasks?: TaskSubtask[] | null;
}): Task => {
  const now = new Date().toISOString();
  const subtasks = sanitizeSubtasks(input.subtasks);
  return {
    id: `${Date.now().toString(36)}-${randomSegment()}`,
    title: input.title.trim(),
    description: input.description?.trim(),
    category: input.category?.trim() || 'Personal',
    categoryId: input.categoryId ?? undefined,
    categoryColor: input.categoryColor ?? undefined,
    priority: input.priority || 'medium',
    status: 'backlog',
    startDate: input.startDate ?? undefined,
    dueDate: input.dueDate ?? undefined,
    tags: normalizeTags(input.tags),
    goalId: input.goalId ?? undefined,
    subtasks,
    createdAt: now,
    updatedAt: now
  };
};

export const updateTaskFields = (task: Task, patch: EditableTaskFields): Task => ({
  ...task,
  ...patch,
  category: patch.category ?? task.category,
  categoryId: patch.categoryId === null ? undefined : patch.categoryId ?? task.categoryId,
  categoryColor: patch.categoryColor === null ? undefined : patch.categoryColor ?? task.categoryColor,
  startDate: patch.startDate === null ? undefined : patch.startDate ?? task.startDate,
  dueDate: patch.dueDate === null ? undefined : patch.dueDate ?? task.dueDate,
  tags: patch.tags === undefined ? task.tags : normalizeTags(patch.tags),
  goalId: patch.goalId === null ? undefined : patch.goalId ?? task.goalId,
  subtasks: patch.subtasks === null ? undefined : sanitizeSubtasks(patch.subtasks) ?? task.subtasks,
  updatedAt: new Date().toISOString()
});

export const getTaskInsights = (tasks: Task[], today = new Date()): TaskInsights => {
  const start = startOfDay(today);

  return tasks.reduce<TaskInsights>(
    (acc, task) => {
      acc.total += 1;
      if (task.status === 'done') {
        acc.completed += 1;
      } else {
        acc.active += 1;
      }

      if (task.dueDate) {
        const due = parseISO(task.dueDate);
        if (isBefore(due, start) && task.status !== 'done') {
          acc.overdue += 1;
        }
      }

      return acc;
    },
    { total: 0, active: 0, completed: 0, overdue: 0 }
  );
};

const matchesRange = (task: Task, range: TaskFilter['range'], now: Date): boolean => {
  if (!task.dueDate || range === 'all') return true;
  const due = parseISO(task.dueDate);
  if (range === 'today') {
    const start = startOfDay(now);
    const end = endOfDay(now);
    return isWithinInterval(due, { start, end });
  }
  if (range === 'week') {
    const start = startOfDay(now);
    const end = endOfDay(addDays(now, 7));
    return isWithinInterval(due, { start, end });
  }
  return true;
};

const matchesStatus = (task: Task, status: TaskFilter['status']): boolean =>
  status === 'all' ? true : task.status === status;

const matchesCategory = (task: Task, category: TaskFilter['category']): boolean =>
  category === 'all' ? true : task.category.toLowerCase() === category.toLowerCase();

const matchesQuery = (task: Task, query: string): boolean => {
  if (!query) return true;
  const target = `${task.title} ${task.description ?? ''}`.toLowerCase();
  return target.includes(query.toLowerCase());
};

export const filterTasks = (tasks: Task[], filter: TaskFilter, now = new Date()): Task[] =>
  tasks.filter(
    (task) =>
      matchesStatus(task, filter.status) &&
      matchesCategory(task, filter.category) &&
      matchesRange(task, filter.range, now) &&
      matchesQuery(task, filter.query)
  );

export const getDefaultFilter = (): TaskFilter => ({
  status: 'all',
  category: 'all',
  query: '',
  range: 'all'
});

export const demoTasks: Task[] = [
  {
    id: '1',
    title: 'Planejar sprint da equipe',
    description: 'Revisar entregas e definir metas da próxima sprint com o time.',
    category: 'Trabalho',
    status: 'in_progress',
    priority: 'high',
    startDate: new Date().toISOString(),
    dueDate: addDays(new Date(), 1).toISOString(),
    tags: ['planejamento', 'lancamento'],
    goalId: 'goal-focus',
    subtasks: [
      { ...makeSubtask('Revisar backlog'), completed: true },
      makeSubtask('Listar riscos'),
      makeSubtask('Enviar plano ao time')
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Consulta médica',
    description: 'Chegar 10 minutos antes para preencher ficha.',
    category: 'Pessoal',
    status: 'backlog',
    priority: 'medium',
    startDate: addDays(new Date(), 2).toISOString(),
    dueDate: addDays(new Date(), 3).toISOString(),
    tags: ['saúde'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Treino funcional',
    category: 'Bem-estar',
    status: 'done',
    priority: 'low',
    startDate: addDays(new Date(), -3).toISOString(),
    dueDate: addDays(new Date(), -1).toISOString(),
    tags: ['bem-estar', 'rotina'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const toggleStatus = (task: Task): Task => ({
  ...task,
  status: task.status === 'done' ? 'backlog' : 'done',
  updatedAt: new Date().toISOString()
});

export const promoteTask = (task: Task): Task => {
  if (task.status === 'backlog') return { ...task, status: 'in_progress', updatedAt: new Date().toISOString() };
  if (task.status === 'in_progress') return { ...task, status: 'done', updatedAt: new Date().toISOString() };
  return { ...task, status: 'backlog', updatedAt: new Date().toISOString() };
};

export const isOverdue = (task: Task, now = new Date()): boolean => {
  if (!task.dueDate || task.status === 'done') return false;
  return isAfter(now, new Date(task.dueDate));
};
