import { format } from 'date-fns';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { CalendarMark, Goal, Milestone, PlannerCategory, PlannerNote, PlannerSection, ScheduleEvent } from '@/types/planner';
import type { EditableTaskFields, Task, TaskFilter } from '@/types/task';
import { calculateGoalProgress, buildCalendarMatrix, createGoal, createScheduleEvent, createCalendarMark, createNote, groupAgendaByDate } from '@/utils/plannerUtils';
import { createTask, filterTasks, getDefaultFilter, getTaskInsights, promoteTask, toggleStatus, updateTaskFields } from '@/utils/taskUtils';
import { buildEmptySnapshot, loadPlannerSnapshot, normalizeSnapshot, persistPlannerSnapshot, type PlannerSnapshot } from '@/storage/plannerStorage';
import { clearSyncQueue, loadSyncQueue, replaceQueue, type SyncOperation } from '@/storage/syncQueue';
import { defaultCategories } from '@/data/defaultCategories';
import { fetchPlannerSnapshot, PlannerSyncConflict, syncPlannerOperations } from '@/services/plannerApi';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAuth } from '@/state/AuthContext';

interface SyncStatus {
  queueSize: number;
  syncing: boolean;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  isOnline: boolean;
  requiresAuth: boolean;
  canRetry: boolean;
}

interface PlannerState {
  ready: boolean;
  version: number;
  updatedAt: string | null;
  tasks: Task[];
  goals: Goal[];
  events: ScheduleEvent[];
  marks: CalendarMark[];
  notes: PlannerNote[];
  categories: PlannerCategory[];
  filter: TaskFilter;
  activeSection: PlannerSection;
  activeDate: string;
}

type Action =
  | {
      type: 'HYDRATE';
      payload: PlannerSnapshot;
    }
  | { type: 'SET_META'; payload: { version: number; updatedAt: string | null } }
  | { type: 'SET_SECTION'; payload: PlannerSection }
  | { type: 'SET_DATE'; payload: string }
  | { type: 'SET_FILTER'; payload: Partial<TaskFilter> }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: Task['id']; patch: EditableTaskFields } }
  | { type: 'DELETE_TASK'; payload: { id: Task['id'] } }
  | { type: 'ADVANCE_TASK'; payload: { id: Task['id'] } }
  | { type: 'TOGGLE_TASK'; payload: { id: Task['id'] } }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: { id: Goal['id'] } }
  | { type: 'ADD_EVENT'; payload: ScheduleEvent }
  | { type: 'UPDATE_EVENT'; payload: ScheduleEvent }
  | { type: 'DELETE_EVENT'; payload: { id: ScheduleEvent['id'] } }
  | { type: 'ADD_MARK'; payload: CalendarMark }
  | { type: 'UPDATE_MARK'; payload: CalendarMark }
  | { type: 'REMOVE_MARK'; payload: { id: CalendarMark['id'] } }
  | { type: 'ADD_NOTE'; payload: PlannerNote }
  | { type: 'UPDATE_NOTE'; payload: PlannerNote }
  | { type: 'DELETE_NOTE'; payload: { id: PlannerNote['id'] } }
  | { type: 'ADD_CATEGORY'; payload: PlannerCategory }
  | { type: 'DELETE_CATEGORY'; payload: { id: PlannerCategory['id'] } };

const COLLECTION_KEYS = ['tasks', 'goals', 'events', 'marks', 'notes', 'categories'] as const;
type CollectionKey = (typeof COLLECTION_KEYS)[number];

const entityIdOf = (entity: { id?: string | number } | undefined): string | null => {
  if (!entity || entity.id === undefined || entity.id === null) return null;
  return String(entity.id);
};

const toComparable = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => toComparable(item));
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return entries.reduce<Record<string, unknown>>((acc, [key, nested]) => {
      acc[key] = toComparable(nested);
      return acc;
    }, {});
  }
  return value;
};

const areEntitiesEqual = (a: Record<string, unknown>, b: Record<string, unknown>): boolean => {
  if (a === b) return true;
  return JSON.stringify(toComparable(a)) === JSON.stringify(toComparable(b));
};

const sortOperations = (operations: SyncOperation[]): SyncOperation[] =>
  [...operations].sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime());

const diffCollection = <T extends { id?: string | number }>(
  previous: T[],
  next: T[],
  entityType: SyncOperation['entityType'],
  baseVersion: number,
  createTimestamp: () => string
): SyncOperation[] => {
  const operations: SyncOperation[] = [];
  const previousMap = new Map<string, T>();
  const nextMap = new Map<string, T>();

  previous.forEach((item) => {
    const id = entityIdOf(item);
    if (id) previousMap.set(id, item);
  });
  next.forEach((item) => {
    const id = entityIdOf(item);
    if (id) nextMap.set(id, item);
  });

  nextMap.forEach((item, id) => {
    const existing = previousMap.get(id);
    if (!existing) {
      operations.push({
        id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        entityType,
        entityId: id,
        changeType: 'create',
        payload: item as Record<string, unknown>,
        baseVersion,
        timestamp: createTimestamp()
      });
      return;
    }

    if (!areEntitiesEqual(existing as Record<string, unknown>, item as Record<string, unknown>)) {
      operations.push({
        id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        entityType,
        entityId: id,
        changeType: 'update',
        payload: item as Record<string, unknown>,
        baseVersion,
        timestamp: createTimestamp()
      });
    }
  });

  previousMap.forEach((_item, id) => {
    if (nextMap.has(id)) return;
    operations.push({
      id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      entityType,
      entityId: id,
      changeType: 'delete',
      baseVersion,
      timestamp: createTimestamp()
    });
  });

  return operations;
};

const buildDiffOperations = (previous: PlannerSnapshot | null, next: PlannerSnapshot): SyncOperation[] => {
  if (!previous) return [];
  const baseVersion = previous.version ?? 0;
  const operations: SyncOperation[] = [];
  let counter = 0;
  const createTimestamp = () => new Date(Date.now() + counter++).toISOString();
  COLLECTION_KEYS.forEach((key) => {
    const prevCollection = previous[key as CollectionKey] as unknown as { id?: string | number }[];
    const nextCollection = next[key as CollectionKey] as unknown as { id?: string | number }[];
    operations.push(
      ...diffCollection(prevCollection ?? [], nextCollection ?? [], key as SyncOperation['entityType'], baseVersion, createTimestamp)
    );
  });
  return operations;
};

const snapshotFromState = (state: PlannerState): PlannerSnapshot => ({
  version: state.version,
  updatedAt: state.updatedAt,
  tasks: state.tasks,
  goals: state.goals,
  events: state.events,
  marks: state.marks,
  notes: state.notes,
  categories: state.categories
});

const initialState: PlannerState = {
  ready: false,
  version: 0,
  updatedAt: null,
  tasks: [],
  goals: [],
  events: [],
  marks: [],
  notes: [],
  categories: defaultCategories,
  filter: getDefaultFilter(),
  activeSection: 'tasks',
  activeDate: format(new Date(), 'yyyy-MM-dd')
};

const normalizeDayKey = (value: string): string => {
  if (!value) return format(new Date(), 'yyyy-MM-dd');
  if (value.length === 10 && value.includes('-')) return value;
  return format(new Date(value), 'yyyy-MM-dd');
};

const toReferenceDate = (value: string): Date => {
  const hasTime = value.includes('T');
  const iso = hasTime ? value : `${value}T12:00:00`;
  return new Date(iso);
};

const normalizeCategoryName = (value?: string) => value?.trim().toLowerCase() ?? '';

const alignTaskCategories = (tasks: Task[], categories: PlannerCategory[]): Task[] => {
  if (!categories.length) return tasks;
  return tasks.map((task) => {
    const match = task.categoryId
      ? categories.find((cat) => cat.id === task.categoryId)
      : categories.find((cat) => normalizeCategoryName(cat.name) === normalizeCategoryName(task.category));
    if (!match) return task;
    if (task.categoryId === match.id && task.category === match.name && task.categoryColor === match.color) return task;
    return {
      ...task,
      categoryId: match.id,
      category: match.name,
      categoryColor: match.color
    };
  });
};

const alignGoalCategories = (goals: Goal[], categories: PlannerCategory[]): Goal[] => {
  if (!categories.length) return goals;
  return goals.map((goal) => {
    const match = goal.categoryId
      ? categories.find((cat) => cat.id === goal.categoryId)
      : categories.find((cat) => normalizeCategoryName(cat.name) === normalizeCategoryName(goal.category));
    if (!match) return goal;
    if (goal.categoryId === match.id && goal.category === match.name && goal.categoryColor === match.color) return goal;
    return {
      ...goal,
      categoryId: match.id,
      category: match.name,
      categoryColor: match.color
    };
  });
};

const makeCategoryId = () => `cat-${Math.random().toString(36).slice(2, 7)}`;

const synchronizeGoalsWithTasks = (goals: Goal[], tasks: Task[]): Goal[] => {
  if (!goals.length) return goals;
  const grouped = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    const goalId = task.goalId;
    if (!goalId) return acc;
    if (!acc[goalId]) acc[goalId] = [];
    acc[goalId]!.push(task);
    return acc;
  }, {});

  return goals.map((goal) => {
    const related = grouped[goal.id] ?? [];
    const completed = related.filter((task) => task.status === 'done').length;
    const derivedProgress = related.length ? Number((completed / related.length).toFixed(2)) : null;
    const baseline = goal.milestones.length ? calculateGoalProgress(goal) : goal.progress ?? 0;

    return {
      ...goal,
      linkedTasks: related.map((task) => task.id),
      progress: derivedProgress ?? baseline
    };
  });
};

const reducer = (state: PlannerState, action: Action): PlannerState => {
  switch (action.type) {
    case 'HYDRATE':
      const normalized = normalizeSnapshot(action.payload);
      const alignedTasks = alignTaskCategories(normalized.tasks, normalized.categories);
      const alignedGoals = alignGoalCategories(normalized.goals, normalized.categories);
      return {
        ...state,
        ready: true,
        version: normalized.version,
        updatedAt: normalized.updatedAt ?? null,
        tasks: alignedTasks,
        goals: synchronizeGoalsWithTasks(alignedGoals, alignedTasks),
        events: normalized.events,
        marks: normalized.marks,
        notes: normalized.notes,
        categories: normalized.categories
      };
    case 'SET_META':
      return { ...state, version: action.payload.version, updatedAt: action.payload.updatedAt };
    case 'SET_SECTION':
      return { ...state, activeSection: action.payload };
    case 'SET_DATE':
      return { ...state, activeDate: action.payload };
    case 'SET_FILTER':
      return { ...state, filter: { ...state.filter, ...action.payload } };
    case 'ADD_TASK': {
      const tasks = [action.payload, ...state.tasks];
      return { ...state, tasks, goals: synchronizeGoalsWithTasks(state.goals, tasks) };
    }
    case 'UPDATE_TASK':
      const tasksAfterUpdate = state.tasks.map((task) => (task.id === action.payload.id ? updateTaskFields(task, action.payload.patch) : task));
      return { ...state, tasks: tasksAfterUpdate, goals: synchronizeGoalsWithTasks(state.goals, tasksAfterUpdate) };
    case 'DELETE_TASK': {
      const tasks = state.tasks.filter((task) => task.id !== action.payload.id);
      return { ...state, tasks, goals: synchronizeGoalsWithTasks(state.goals, tasks) };
    }
    case 'ADVANCE_TASK': {
      const tasks = state.tasks.map((task) => (task.id === action.payload.id ? promoteTask(task) : task));
      return { ...state, tasks, goals: synchronizeGoalsWithTasks(state.goals, tasks) };
    }
    case 'TOGGLE_TASK': {
      const tasks = state.tasks.map((task) => (task.id === action.payload.id ? toggleStatus(task) : task));
      return { ...state, tasks, goals: synchronizeGoalsWithTasks(state.goals, tasks) };
    }
    case 'ADD_GOAL': {
      const goals = synchronizeGoalsWithTasks([action.payload, ...state.goals], state.tasks);
      return { ...state, goals };
    }
    case 'UPDATE_GOAL': {
      const goals = synchronizeGoalsWithTasks(
        state.goals.map((goal) => (goal.id === action.payload.id ? action.payload : goal)),
        state.tasks
      );
      return { ...state, goals };
    }
    case 'DELETE_GOAL': {
      const tasks = state.tasks.map((task) => (task.goalId === action.payload.id ? { ...task, goalId: undefined } : task));
      const events = state.events.map((event) =>
        event.linkedGoalId === action.payload.id ? { ...event, linkedGoalId: undefined } : event
      );
      const notes = state.notes.map((note) => (note.goalId === action.payload.id ? { ...note, goalId: undefined } : note));
      const goals = synchronizeGoalsWithTasks(state.goals.filter((goal) => goal.id !== action.payload.id), tasks);
      return { ...state, tasks, events, notes, goals };
    }
    case 'ADD_EVENT':
      return { ...state, events: [action.payload, ...state.events] };
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map((event) => (event.id === action.payload.id ? action.payload : event))
      };
    case 'DELETE_EVENT':
      return { ...state, events: state.events.filter((event) => event.id !== action.payload.id) };
    case 'ADD_MARK':
      return { ...state, marks: [action.payload, ...state.marks] };
    case 'UPDATE_MARK':
      return {
        ...state,
        marks: state.marks.map((mark) => (mark.id === action.payload.id ? action.payload : mark))
      };
    case 'REMOVE_MARK':
      return { ...state, marks: state.marks.filter((mark) => mark.id !== action.payload.id) };
    case 'ADD_NOTE':
      return { ...state, notes: [action.payload, ...state.notes] };
    case 'UPDATE_NOTE':
      return { ...state, notes: state.notes.map((note) => (note.id === action.payload.id ? action.payload : note)) };
    case 'DELETE_NOTE':
      return { ...state, notes: state.notes.filter((note) => note.id !== action.payload.id) };
    case 'ADD_CATEGORY': {
      const exists = state.categories.some((category) => normalizeCategoryName(category.name) === normalizeCategoryName(action.payload.name));
      if (exists) return state;
      return { ...state, categories: [...state.categories, action.payload] };
    }
    case 'DELETE_CATEGORY': {
      const categories = state.categories.filter((category) => category.id !== action.payload.id);
      const tasks = state.tasks.map((task) =>
        task.categoryId === action.payload.id ? { ...task, categoryId: undefined, categoryColor: undefined } : task
      );
      const goals = state.goals.map((goal) =>
        goal.categoryId === action.payload.id ? { ...goal, categoryId: undefined, categoryColor: undefined } : goal
      );
      return { ...state, categories, tasks, goals: synchronizeGoalsWithTasks(goals, tasks) };
    }
    default:
      return state;
  }
};

export const usePlannerStore = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { token } = useAuth();
  const { isOnline } = useNetworkStatus();
  const prevSnapshotRef = useRef<PlannerSnapshot | null>(null);
  const skipDiffRef = useRef(false);
  const queueRef = useRef<SyncOperation[]>([]);
  const processingRef = useRef(false);
  const [queueRevision, setQueueRevision] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  const persistQueue = useCallback(async (operations: SyncOperation[]) => {
    const sorted = sortOperations(operations);
    queueRef.current = sorted;
    try {
      await replaceQueue(sorted);
    } catch (error) {
      console.warn('Erro ao salvar fila local', error);
    }
    setQueueRevision((revision) => revision + 1);
  }, []);

  const appendOperations = useCallback(
    async (operations: SyncOperation[]) => {
      if (!operations.length) return;
      const nextQueue = [...queueRef.current, ...operations];
      await persistQueue(nextQueue);
    },
    [persistQueue]
  );

  const dropOperations = useCallback(
    async (operationIds: string[]) => {
      if (!operationIds.length) return;
      const remaining = queueRef.current.filter((operation) => !operationIds.includes(operation.id));
      await persistQueue(remaining);
    },
    [persistQueue]
  );

  const applyHydration = useCallback(
    (snapshot: PlannerSnapshot) => {
      const normalized = normalizeSnapshot(snapshot);
      skipDiffRef.current = true;
      prevSnapshotRef.current = normalized;
      dispatch({ type: 'HYDRATE', payload: normalized });
    },
    [dispatch]
  );

  const currentSnapshot = useMemo(
    () => snapshotFromState(state),
    [state.version, state.updatedAt, state.tasks, state.goals, state.events, state.marks, state.notes, state.categories]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      const storedQueue = await loadSyncQueue();
      if (!mounted) return;
      queueRef.current = storedQueue;
      setQueueRevision((revision) => revision + 1);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      let resolved: PlannerSnapshot | null = null;

      if (token) {
        try {
          resolved = await fetchPlannerSnapshot(token);
          if (resolved) {
            await persistPlannerSnapshot(resolved);
          }
        } catch (error) {
          console.warn('Não foi possível sincronizar snapshot remoto', error);
        }
      }

      if (!resolved) {
        const localSnapshot = await loadPlannerSnapshot();
        resolved = localSnapshot ?? buildEmptySnapshot();
      }

      if (!mounted) return;

      applyHydration(resolved);
    })();
    return () => {
      mounted = false;
    };
  }, [token, applyHydration]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const storedQueue = await loadSyncQueue();
      if (!mounted) return;
      queueRef.current = storedQueue;
      setQueueRevision((revision) => revision + 1);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    void persistPlannerSnapshot(currentSnapshot);
  }, [state.ready, currentSnapshot]);

  useEffect(() => {
    if (!state.ready) return;
    const previous = prevSnapshotRef.current;
    if (!previous || skipDiffRef.current) {
      prevSnapshotRef.current = currentSnapshot;
      if (skipDiffRef.current) {
        skipDiffRef.current = false;
      }
      return;
    }
    const operations = buildDiffOperations(previous, currentSnapshot);
    if (operations.length) {
      void appendOperations(operations);
    }
    prevSnapshotRef.current = currentSnapshot;
  }, [state.ready, currentSnapshot, appendOperations]);

  const processQueue = useCallback(async () => {
    if (!token || !state.ready || !isOnline) return;
    if (!queueRef.current.length) return;
    if (processingRef.current) return;
    processingRef.current = true;
    setSyncing(true);
    try {
      const result = await syncPlannerOperations(token, {
        clientVersion: state.version,
        operations: queueRef.current
      });
      if (result.appliedOperations.length) {
        await dropOperations(result.appliedOperations);
      }
      if (result.conflicts.length) {
        await dropOperations(result.conflicts.map((conflict) => conflict.operationId));
        console.warn('Operações com conflito removidas', result.conflicts);
        setLastSyncError('Algumas alterações foram descartadas por conflito.');
      } else {
        setLastSyncError(null);
      }
      await persistPlannerSnapshot(result.snapshot);
      applyHydration(result.snapshot);
      setLastSyncAt(new Date().toISOString());
    } catch (error) {
      if (error instanceof PlannerSyncConflict) {
        await persistPlannerSnapshot(error.serverSnapshot);
        await clearSyncQueue();
        queueRef.current = [];
        setQueueRevision((revision) => revision + 1);
        applyHydration(error.serverSnapshot);
        setLastSyncAt(new Date().toISOString());
        setLastSyncError('Detectamos dados mais recentes no servidor e recarregamos sua visão.');
      } else {
        console.warn('Fila aguardando conectividade', error);
        setLastSyncError(error instanceof Error ? error.message : 'Falha ao sincronizar. Tente novamente em instantes.');
      }
    } finally {
      processingRef.current = false;
      setSyncing(false);
    }
  }, [token, state.ready, state.version, dropOperations, applyHydration, isOnline]);

  useEffect(() => {
    if (!token || !state.ready || !isOnline) return;
    if (!queueRef.current.length) return;
    void processQueue();
  }, [token, state.ready, isOnline, queueRevision, processQueue]);

  const syncNow = useCallback(async () => {
    await processQueue();
  }, [processQueue]);

  const filteredTasks = useMemo(() => filterTasks(state.tasks, state.filter), [state.tasks, state.filter]);
  const taskInsights = useMemo(() => getTaskInsights(state.tasks), [state.tasks]);
  const calendarMatrix = useMemo(
    () => buildCalendarMatrix(toReferenceDate(state.activeDate), state.events, state.marks),
    [state.activeDate, state.events, state.marks]
  );
  const agendaByDate = useMemo(() => groupAgendaByDate(state.events, state.marks), [state.events, state.marks]);
  const categoryUsage = useMemo(() => {
    const usage: Record<string, number> = {};
    state.categories.forEach((category) => {
      usage[category.id] = 0;
    });
    const register = (categoryId?: string, categoryName?: string) => {
      if (categoryId && usage[categoryId] !== undefined) {
        usage[categoryId]! += 1;
        return;
      }
      if (categoryName) {
        const match = state.categories.find(
          (category) => normalizeCategoryName(category.name) === normalizeCategoryName(categoryName)
        );
        if (match && usage[match.id] !== undefined) {
          usage[match.id]! += 1;
        }
      }
    };
    state.tasks.forEach((task) => register(task.categoryId, task.category));
    state.goals.forEach((goal) => register(goal.categoryId, goal.category));
    return usage;
  }, [state.categories, state.tasks, state.goals]);

  const addTask = (payload: Parameters<typeof createTask>[0]) =>
    dispatch({ type: 'ADD_TASK', payload: createTask(payload) });
  const updateTask = (id: Task['id'], patch: EditableTaskFields) => dispatch({ type: 'UPDATE_TASK', payload: { id, patch } });
  const deleteTask = (id: Task['id']) => dispatch({ type: 'DELETE_TASK', payload: { id } });
  const advanceTask = (id: Task['id']) => dispatch({ type: 'ADVANCE_TASK', payload: { id } });
  const toggleTask = (id: Task['id']) => dispatch({ type: 'TOGGLE_TASK', payload: { id } });

  const updateGoal = (goal: Goal) => dispatch({ type: 'UPDATE_GOAL', payload: goal });
  const addGoal = (payload: Parameters<typeof createGoal>[0]) => dispatch({ type: 'ADD_GOAL', payload: createGoal(payload) });
  const deleteGoal = (id: Goal['id']) => dispatch({ type: 'DELETE_GOAL', payload: { id } });

  const upsertMilestone = (goalId: Goal['id'], milestone: Milestone) => {
    const goal = state.goals.find((item) => item.id === goalId);
    if (!goal) return;
    const existing = goal.milestones.some((item) => item.id === milestone.id);
    const milestones = existing
      ? goal.milestones.map((item) => (item.id === milestone.id ? milestone : item))
      : [...goal.milestones, milestone];
    const progress = calculateGoalProgress({ ...goal, milestones });
    updateGoal({ ...goal, milestones, progress });
  };

  const addEvent = (payload: Parameters<typeof createScheduleEvent>[0]) =>
    dispatch({ type: 'ADD_EVENT', payload: createScheduleEvent(payload) });
  const updateEvent = (event: ScheduleEvent) => dispatch({ type: 'UPDATE_EVENT', payload: event });
  const deleteEvent = (id: ScheduleEvent['id']) => dispatch({ type: 'DELETE_EVENT', payload: { id } });
  const addMark = (payload: Parameters<typeof createCalendarMark>[0]) => dispatch({ type: 'ADD_MARK', payload: createCalendarMark(payload) });
  const updateMark = (mark: CalendarMark) => dispatch({ type: 'UPDATE_MARK', payload: mark });
  const removeMark = (id: CalendarMark['id']) => dispatch({ type: 'REMOVE_MARK', payload: { id } });
  const addNote = (payload: Parameters<typeof createNote>[0]) => dispatch({ type: 'ADD_NOTE', payload: createNote(payload) });
  const updateNote = (note: PlannerNote) => dispatch({ type: 'UPDATE_NOTE', payload: { ...note, updatedAt: new Date().toISOString() } });
  const deleteNote = (id: PlannerNote['id']) => dispatch({ type: 'DELETE_NOTE', payload: { id } });
  const hydrateSnapshot = (snapshot: PlannerSnapshot) => applyHydration(snapshot);

  const addCategory = (name: string, color: string): boolean => {
    const trimmedName = name.trim();
    if (!trimmedName) return false;
    const exists = state.categories.some(
      (category) => normalizeCategoryName(category.name) === normalizeCategoryName(trimmedName)
    );
    if (exists) return false;
    const normalizedColor = color.trim().startsWith('#') ? color.trim() : `#${color.trim()}`;
    dispatch({
      type: 'ADD_CATEGORY',
      payload: {
        id: makeCategoryId(),
        name: trimmedName,
        color: normalizedColor,
        createdAt: new Date().toISOString()
      }
    });
    return true;
  };

  const canDeleteCategory = (id: PlannerCategory['id']) => (categoryUsage[id] ?? 0) === 0;

  const deleteCategory = (id: PlannerCategory['id']): boolean => {
    if (!canDeleteCategory(id)) return false;
    dispatch({ type: 'DELETE_CATEGORY', payload: { id } });
    return true;
  };

  const setFilter = (next: Partial<TaskFilter>) => dispatch({ type: 'SET_FILTER', payload: next });
  const setSection = (section: PlannerSection) => dispatch({ type: 'SET_SECTION', payload: section });
  const setActiveDate = (iso: string) => dispatch({ type: 'SET_DATE', payload: normalizeDayKey(iso) });

  const queueSize = useMemo(() => queueRef.current.length, [queueRevision]);

  const syncStatus: SyncStatus = useMemo(
    () => ({
      queueSize,
      syncing,
      lastSyncAt,
      lastSyncError,
      isOnline,
      requiresAuth: !token,
      canRetry: Boolean(token && isOnline && queueSize > 0 && !syncing)
    }),
    [queueSize, syncing, lastSyncAt, lastSyncError, isOnline, token]
  );

  return {
    ready: state.ready,
    state,
    version: state.version,
    updatedAt: state.updatedAt,
    tasks: state.tasks,
    goals: state.goals,
    events: state.events,
    marks: state.marks,
    notes: state.notes,
    categories: state.categories,
    filteredTasks,
    filter: state.filter,
    calendarMatrix,
    agendaByDate,
    taskInsights,
    activeSection: state.activeSection,
    activeDate: state.activeDate,
    categoryUsage,
    addTask,
    updateTask,
    deleteTask,
    advanceTask,
    toggleTask,
    addGoal,
    updateGoal,
    deleteGoal,
    upsertMilestone,
    addEvent,
    updateEvent,
    deleteEvent,
    addMark,
    updateMark,
    removeMark,
    addNote,
    updateNote,
    deleteNote,
    hydrateSnapshot,
    addCategory,
    deleteCategory,
    canDeleteCategory,
    setFilter,
    setSection,
    setActiveDate,
    syncStatus,
    syncNow
  };
};
