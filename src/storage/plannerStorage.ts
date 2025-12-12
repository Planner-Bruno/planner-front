import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultCategories } from '@/data/defaultCategories';
import type { CalendarMark, Goal, PlannerCategory, PlannerNote, ScheduleEvent } from '@/types/planner';
import type { FinanceSnapshot } from '@/types/finance';
import { createEmptyFinanceSnapshot } from '@/types/finance';
import type { Task } from '@/types/task';

const STORAGE_KEY = 'planner.superapp@v1';

export interface PlannerSnapshot {
  version: number;
  updatedAt?: string | null;
  tasks: Task[];
  goals: Goal[];
  events: ScheduleEvent[];
  marks: CalendarMark[];
  notes: PlannerNote[];
  categories: PlannerCategory[];
  finance: FinanceSnapshot;
}

const cloneCategories = (): PlannerCategory[] => defaultCategories.map((category) => ({ ...category }));

export const ensureFinanceSnapshot = (snapshot?: FinanceSnapshot | null): FinanceSnapshot => {
  const base = createEmptyFinanceSnapshot();
  if (!snapshot) return base;
  return {
    wallets: Array.isArray(snapshot.wallets) ? snapshot.wallets : base.wallets,
    categories: Array.isArray(snapshot.categories) ? snapshot.categories : base.categories,
    transactions: Array.isArray(snapshot.transactions) ? snapshot.transactions : base.transactions,
    budgets: Array.isArray(snapshot.budgets) ? snapshot.budgets : base.budgets,
    goals: Array.isArray(snapshot.goals) ? snapshot.goals : base.goals,
    recurring_rules: Array.isArray(snapshot.recurring_rules) ? snapshot.recurring_rules : base.recurring_rules
  };
};

export const buildEmptySnapshot = (): PlannerSnapshot => ({
  version: 0,
  updatedAt: null,
  tasks: [],
  goals: [],
  events: [],
  marks: [],
  notes: [],
  categories: cloneCategories(),
  finance: ensureFinanceSnapshot(createEmptyFinanceSnapshot())
});

export const normalizeSnapshot = (snapshot?: PlannerSnapshot | null): PlannerSnapshot => {
  const raw = snapshot as Record<string, unknown> | undefined;
  const versionValue = raw?.['version'];
  const updatedAtValue = raw?.['updatedAt'] ?? raw?.['updated_at'] ?? null;
  const resolvedVersion = typeof versionValue === 'number' ? (versionValue as number) : 0;
  const resolvedUpdatedAt = typeof updatedAtValue === 'string' ? (updatedAtValue as string) : null;
  return {
    version: resolvedVersion,
    updatedAt: resolvedUpdatedAt,
    tasks: snapshot?.tasks ?? [],
    goals: snapshot?.goals ?? [],
    events: snapshot?.events ?? [],
    marks: snapshot?.marks ?? [],
    notes: snapshot?.notes ?? [],
    categories: snapshot?.categories?.length ? snapshot.categories : cloneCategories(),
    finance: ensureFinanceSnapshot(snapshot?.finance)
  };
};

export const loadPlannerSnapshot = async (): Promise<PlannerSnapshot | null> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlannerSnapshot;
    return normalizeSnapshot(parsed);
  } catch (error) {
    console.warn('Erro ao carregar planner', error);
    return null;
  }
};

export const persistPlannerSnapshot = async (snapshot: PlannerSnapshot): Promise<void> => {
  try {
    const normalized = normalizeSnapshot(snapshot);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch (error) {
    console.warn('Erro ao salvar planner', error);
  }
};

export const resetPlannerSnapshot = async () => AsyncStorage.removeItem(STORAGE_KEY);
