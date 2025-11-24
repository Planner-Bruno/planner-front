import { addDays, endOfMonth, format, startOfMonth, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type {
  CalendarMark,
  Goal,
  Milestone,
  PlannerInsights,
  PlannerNote,
  ScheduleEvent,
  ScheduleEventKind
} from '@/types/planner';
import type { Task } from '@/types/task';
import { normalizeDateInput } from '@/utils/dateUtils';
import { demoTasks } from './taskUtils';

const makeId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`;
const ISO_DATE_LENGTH = 10;
const ISO_DAY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const sanitizeTags = (tags?: string[]): string[] | undefined => {
  if (!tags) return undefined;
  const cleaned = tags.map((tag) => tag.trim()).filter(Boolean).map((tag) => tag.slice(0, 32));
  return cleaned.length ? cleaned : undefined;
};

export const extractDayKey = (value: string): string => {
  if (!value) return format(new Date(), 'yyyy-MM-dd');
  if (value.length >= ISO_DATE_LENGTH) {
    const candidate = value.slice(0, ISO_DATE_LENGTH);
    if (ISO_DAY_REGEX.test(candidate)) {
      return candidate;
    }
  }
  return format(new Date(value), 'yyyy-MM-dd');
};

export const createGoal = (input: {
  title: string;
  description: string;
  category: string;
  categoryId?: string;
  categoryColor?: string;
  startDate?: string;
  dueDate?: string;
  tags?: string[];
  color: string;
}): Goal => ({
  id: makeId('goal'),
  title: input.title.trim(),
  description: input.description.trim(),
  category: input.category,
  categoryId: input.categoryId,
  categoryColor: input.categoryColor,
  color: input.color,
  startDate: normalizeDateInput(input.startDate) ?? undefined,
  dueDate: normalizeDateInput(input.dueDate) ?? undefined,
  tags: sanitizeTags(input.tags),
  progress: 0,
  milestones: [],
  linkedTasks: []
});

export const createMilestone = (goalId: string, title: string, dueDate?: string): Milestone => ({
  id: makeId('mile'),
  goalId,
  title,
  progress: 0,
  completed: false,
  dueDate
});

export const createScheduleEvent = (input: {
  kind?: ScheduleEventKind;
  title: string;
  description?: string;
  date: string;
  start?: string;
  end?: string;
  color: string;
  reminderNote?: string;
  linkedGoalId?: string;
  linkedTaskId?: string;
}): ScheduleEvent => ({
  id: makeId('event'),
  kind: input.kind ?? 'event',
  title: input.title.trim(),
  description: input.description?.trim(),
  date: normalizeDateInput(input.date) ?? new Date().toISOString(),
  start: input.start,
  end: input.end,
  color: input.color,
  reminderNote: input.reminderNote?.trim(),
  linkedGoalId: input.linkedGoalId,
  linkedTaskId: input.linkedTaskId
});

export const createCalendarMark = (input: { date: string; label: string; color: string }): CalendarMark => ({
  id: makeId('mark'),
  date: normalizeDateInput(input.date) ?? new Date().toISOString(),
  label: input.label.trim(),
  color: input.color
});

export const createNote = (input: { title: string; content: string; color?: string; tags?: string[]; goalId?: string | null }): PlannerNote => ({
  id: makeId('note'),
  title: input.title.trim() || 'Sem título',
  content: input.content.trim(),
  color: input.color ?? '#FDE68A',
  tags: input.tags?.map((tag) => tag.trim()).filter(Boolean),
  goalId: input.goalId ?? undefined,
  updatedAt: new Date().toISOString()
});

export const calculateGoalProgress = (goal: Goal): number => {
  if (!goal.milestones.length) return goal.progress;
  const avg = goal.milestones.reduce((acc, item) => acc + item.progress, 0) / goal.milestones.length;
  return Number(avg.toFixed(2));
};

export const computePlannerInsights = (tasks: Task[], goals: Goal[], events: ScheduleEvent[], notes: PlannerNote[]): PlannerInsights => {
  const completedTasks = tasks.filter((task) => task.status === 'done').length;
  const weeklyFocusHours = Math.min(events.length * 1.5, 25); // heurística
  const goalMomentum = goals.length ? goals.reduce((acc, goal) => acc + calculateGoalProgress(goal), 0) / goals.length : 0;
  const nextMilestone = goals
    .flatMap((goal) => goal.milestones)
    .filter((milestone) => !milestone.completed && milestone.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0];

  const taskBuckets = tasks.reduce<Record<string, { total: number; completed: number }>>((acc, task) => {
    const goalId = task.goalId;
    if (!goalId) return acc;
    if (!acc[goalId]) {
      acc[goalId] = { total: 0, completed: 0 };
    }
    acc[goalId]!.total += 1;
    if (task.status === 'done') {
      acc[goalId]!.completed += 1;
    }
    return acc;
  }, {});

  const eventBuckets = events.reduce<Record<string, { total: number; next?: ScheduleEvent }>>((acc, event) => {
    const goalId = event.linkedGoalId;
    if (!goalId) return acc;
    if (!acc[goalId]) {
      acc[goalId] = { total: 0 };
    }
    acc[goalId]!.total += 1;
    const eventDate = new Date(event.date).getTime();
    if (!acc[goalId]!.next || eventDate < new Date(acc[goalId]!.next!.date).getTime()) {
      acc[goalId]!.next = event;
    }
    return acc;
  }, {});

  const noteBuckets = notes.reduce<Record<string, { total: number; latest?: PlannerNote }>>((acc, note) => {
    const goalId = note.goalId;
    if (!goalId) return acc;
    if (!acc[goalId]) {
      acc[goalId] = { total: 0 };
    }
    acc[goalId]!.total += 1;
    if (!acc[goalId]!.latest || new Date(note.updatedAt).getTime() > new Date(acc[goalId]!.latest!.updatedAt).getTime()) {
      acc[goalId]!.latest = note;
    }
    return acc;
  }, {});

  const goalHighlights = goals
    .map((goal) => {
      const bucket = taskBuckets[goal.id];
      const totalTasks = bucket?.total ?? 0;
      const completedFromTasks = bucket?.completed ?? 0;
      const progressFromTasks = bucket && totalTasks ? completedFromTasks / totalTasks : undefined;
      const eventBucket = eventBuckets[goal.id];
      const noteBucket = noteBuckets[goal.id];
      const nextEventLabel = eventBucket?.next
        ? `${format(new Date(eventBucket.next.date), 'dd MMM', { locale: ptBR })}${
            eventBucket.next.start ? ` · ${eventBucket.next.start}` : ''
          } · ${eventBucket.next.title}`
        : undefined;
      const latestNoteTitle = noteBucket?.latest?.title;
      return {
        id: goal.id,
        title: goal.title,
        color: goal.color,
        progress: progressFromTasks ?? goal.progress,
        completedTasks: completedFromTasks,
        totalTasks,
        eventCount: eventBucket?.total ?? 0,
        nextEventLabel,
        noteCount: noteBucket?.total ?? 0,
        latestNoteTitle
      };
    })
    .sort((a, b) => a.progress - b.progress)
    .slice(0, 3);

  return {
    completedTasks,
    weeklyFocusHours: Number(weeklyFocusHours.toFixed(1)),
    goalMomentum: Number(goalMomentum.toFixed(2)),
    nextMilestone,
    activeGoals: goals.length,
    goalHighlights
  };
};

export interface CalendarDay {
  date: Date;
  label: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: ScheduleEvent[];
  reminders: ScheduleEvent[];
  marks: CalendarMark[];
}

export const buildCalendarMatrix = (reference: Date, events: ScheduleEvent[], marks: CalendarMark[]): CalendarDay[][] => {
  const start = startOfWeek(startOfMonth(reference), { weekStartsOn: 0 });
  const end = endOfMonth(reference);
  const matrix: CalendarDay[][] = [];
  let cursor = start;

  const shouldContinue = () => {
    const lastWeek = matrix[matrix.length - 1];
    if (!lastWeek) return true;
    return cursor <= end || lastWeek.length < 7;
  };

  while (shouldContinue()) {
    const lastWeek = matrix[matrix.length - 1];
    if (!lastWeek || lastWeek.length === 7) {
      matrix.push([]);
    }
    const dayKey = format(cursor, 'yyyy-MM-dd');
    const matchingEvents = events.filter((event) => extractDayKey(event.date) === dayKey);
    const dayMarks = marks.filter((mark) => extractDayKey(mark.date) === dayKey);
    matrix[matrix.length - 1].push({
      date: cursor,
      label: format(cursor, 'd', { locale: ptBR }),
      isCurrentMonth: cursor.getMonth() === reference.getMonth(),
      isToday: format(cursor, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
      events: matchingEvents.filter((event) => event.kind === 'event'),
      reminders: matchingEvents.filter((event) => event.kind === 'reminder'),
      marks: dayMarks
    });
    cursor = addDays(cursor, 1);
    if (matrix.length > 6 && matrix[matrix.length - 1].length === 7) break;
  }

  return matrix;
};

export interface AgendaBucket {
  events: ScheduleEvent[];
  reminders: ScheduleEvent[];
  marks: CalendarMark[];
}

export const groupAgendaByDate = (events: ScheduleEvent[], marks: CalendarMark[]): Record<string, AgendaBucket> => {
  const buckets: Record<string, AgendaBucket> = {};

  const ensureBucket = (key: string) => {
    if (!buckets[key]) {
      buckets[key] = { events: [], reminders: [], marks: [] };
    }
    return buckets[key];
  };

  marks.forEach((mark) => {
    const key = extractDayKey(mark.date);
    ensureBucket(key).marks.push(mark);
  });

  events.forEach((event) => {
    const key = extractDayKey(event.date);
    const bucket = ensureBucket(key);
    if (event.kind === 'reminder') {
      bucket.reminders.push(event);
    } else {
      bucket.events.push(event);
    }
  });

  return buckets;
};

export const demoGoals: Goal[] = [
  {
    id: 'goal-focus',
    title: 'Lançar side project do planner',
    description: 'Versão beta pública com onboarding e relatórios automáticos.',
    category: 'carreira',
    color: '#F472B6',
    startDate: addDays(new Date(), -15).toISOString(),
    dueDate: addDays(new Date(), 45).toISOString(),
    tags: ['produto', 'lançamento'],
    progress: 0.45,
    milestones: [
      {
        id: 'mile-1',
        goalId: 'goal-focus',
        title: 'Validar protótipo com 10 usuários',
        progress: 0.6,
        completed: false,
        dueDate: addDays(new Date(), 10).toISOString()
      },
      {
        id: 'mile-2',
        goalId: 'goal-focus',
        title: 'Configurar métricas de uso',
        progress: 0.3,
        completed: false,
        dueDate: addDays(new Date(), 25).toISOString()
      }
    ],
    linkedTasks: [demoTasks[0].id]
  },
  {
    id: 'goal-health',
    title: 'Maratona 10K confortável',
    description: 'Participar da prova de fim de ano correndo com energia.',
    category: 'bem-estar',
    color: '#34D399',
    startDate: addDays(new Date(), -30).toISOString(),
    tags: ['bem-estar', 'corrida'],
    progress: 0.35,
    milestones: [
      {
        id: 'mile-3',
        goalId: 'goal-health',
        title: 'Correr 7K abaixo de 40min',
        progress: 0.4,
        completed: false,
        dueDate: addDays(new Date(), 18).toISOString()
      },
      {
        id: 'mile-4',
        goalId: 'goal-health',
        title: 'Agendar avaliação cardiológica',
        progress: 0.2,
        completed: false
      }
    ],
    linkedTasks: []
  }
];

export const demoEvents: ScheduleEvent[] = [
  {
    id: 'event-1',
    kind: 'event',
    title: 'Deep work - UX Flow',
    description: 'Criar telas de onboarding',
    date: new Date().toISOString(),
    start: '09:00',
    end: '11:00',
    color: '#818CF8',
    linkedGoalId: 'goal-focus'
  },
  {
    id: 'event-2',
    kind: 'reminder',
    title: 'Corrida leve',
    date: addDays(new Date(), 1).toISOString(),
    start: '06:30',
    color: '#34D399',
    reminderNote: 'Alongar 10 minutos antes',
    linkedGoalId: 'goal-health'
  }
];

export const demoMarks: CalendarMark[] = [
  {
    id: 'mark-1',
    date: addDays(new Date(), 2).toISOString(),
    color: '#FDE047',
    label: 'Entrega'
  },
  {
    id: 'mark-2',
    date: addDays(new Date(), -1).toISOString(),
    color: '#A5B4FC',
    label: 'Check-in'
  }
];

export const demoNotes: PlannerNote[] = [
  {
    id: 'note-1',
    title: 'Moodboard visual',
    content: 'Coletar referências neon + glitch para a próxima sprint e validar com squad.',
    color: '#FDE68A',
    tags: ['design'],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'note-2',
    title: 'Checkpoints IA',
    content: 'Explorar APIs de resumo automático e mapear MVP de copiloto interno.',
    color: '#BFDBFE',
    tags: ['IA', 'roadmap'],
    updatedAt: new Date().toISOString()
  }
];
