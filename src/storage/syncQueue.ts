import AsyncStorage from '@react-native-async-storage/async-storage';

export type PlannerEntityType = 'tasks' | 'goals' | 'events' | 'marks' | 'notes' | 'categories';
export type PlannerChangeType = 'create' | 'update' | 'delete';

export interface SyncOperation {
  id: string;
  entityType: PlannerEntityType;
  entityId?: string | null;
  changeType: PlannerChangeType;
  payload?: Record<string, unknown>;
  baseVersion?: number | null;
  timestamp: string; // ISO string para ordenação estável
}

const STORAGE_KEY = 'planner.syncQueue@v1';

const sortByTimestamp = (operations: SyncOperation[]): SyncOperation[] =>
  [...operations].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

export const loadSyncQueue = async (): Promise<SyncOperation[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SyncOperation[];
    return sortByTimestamp(parsed);
  } catch (error) {
    console.warn('Erro ao ler fila de sync', error);
    return [];
  }
};

const persistSyncQueue = async (operations: SyncOperation[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sortByTimestamp(operations)));
  } catch (error) {
    console.warn('Erro ao salvar fila de sync', error);
  }
};

export const enqueueOperation = async (operation: SyncOperation): Promise<void> => {
  const current = await loadSyncQueue();
  const withoutDuplicates = current.filter((item) => item.id !== operation.id);
  withoutDuplicates.push(operation);
  await persistSyncQueue(withoutDuplicates);
};

export const removeOperations = async (operationIds: string[]): Promise<void> => {
  if (!operationIds.length) return;
  const current = await loadSyncQueue();
  const remaining = current.filter((operation) => !operationIds.includes(operation.id));
  await persistSyncQueue(remaining);
};

export const clearSyncQueue = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Erro ao limpar fila de sync', error);
  }
};

export const replaceQueue = async (operations: SyncOperation[]): Promise<void> => persistSyncQueue(operations);
