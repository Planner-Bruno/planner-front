import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultCategories } from '@/data/defaultCategories';
import type { CalendarMark, Goal, PlannerCategory, PlannerNote, ScheduleEvent } from '@/types/planner';
import type { Task } from '@/types/task';

const STORAGE_KEY = 'planner.superapp@v1';

export interface PlannerSnapshot {
  tasks: Task[];
  goals: Goal[];
  events: ScheduleEvent[];
  marks: CalendarMark[];
  notes: PlannerNote[];
  categories: PlannerCategory[];
}

const cloneCategories = (): PlannerCategory[] => defaultCategories.map((category) => ({ ...category }));

export const buildEmptySnapshot = (): PlannerSnapshot => ({
  tasks: [],
  goals: [],
  events: [],
  marks: [],
  notes: [],
  categories: cloneCategories()
});

export const normalizeSnapshot = (snapshot?: PlannerSnapshot | null): PlannerSnapshot => ({
  tasks: snapshot?.tasks ?? [],
  goals: snapshot?.goals ?? [],
  events: snapshot?.events ?? [],
  marks: snapshot?.marks ?? [],
  notes: snapshot?.notes ?? [],
  categories: snapshot?.categories?.length ? snapshot.categories : cloneCategories()
});

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
