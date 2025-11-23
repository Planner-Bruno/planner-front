import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Task } from '@/types/task';

const STORAGE_KEY = 'taskflow.tasks.v1';

export const loadTasks = async (): Promise<Task[] | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as Task[];
  } catch (error) {
    console.warn('Não foi possível carregar tarefas salvas', error);
    return null;
  }
};

export const persistTasks = async (tasks: Task[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.warn('Não foi possível salvar tarefas', error);
  }
};

export const resetTasks = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};
