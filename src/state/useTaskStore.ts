import { useEffect, useMemo, useReducer } from 'react';
import type { EditableTaskFields, Task, TaskFilter } from '@/types/task';
import { loadTasks, persistTasks } from '@/storage/taskStorage';
import { createTask, filterTasks, getDefaultFilter, getTaskInsights, promoteTask, toggleStatus, updateTaskFields } from '@/utils/taskUtils';

interface TaskState {
  ready: boolean;
  tasks: Task[];
  filter: TaskFilter;
}

type Action =
  | { type: 'HYDRATE'; payload: Task[] }
  | { type: 'ADD'; payload: Task }
  | { type: 'UPDATE'; payload: { id: Task['id']; patch: EditableTaskFields } }
  | { type: 'DELETE'; payload: { id: Task['id'] } }
  | { type: 'ADVANCE'; payload: { id: Task['id'] } }
  | { type: 'TOGGLE_DONE'; payload: { id: Task['id'] } }
  | { type: 'SET_FILTER'; payload: Partial<TaskFilter> };

const initialState: TaskState = {
  ready: false,
  tasks: [],
  filter: getDefaultFilter()
};

const reducer = (state: TaskState, action: Action): TaskState => {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ready: true, tasks: action.payload };
    case 'ADD':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'UPDATE':
      return {
        ...state,
        tasks: state.tasks.map((task) => (task.id === action.payload.id ? updateTaskFields(task, action.payload.patch) : task))
      };
    case 'DELETE':
      return { ...state, tasks: state.tasks.filter((task) => task.id !== action.payload.id) };
    case 'ADVANCE':
      return {
        ...state,
        tasks: state.tasks.map((task) => (task.id === action.payload.id ? promoteTask(task) : task))
      };
    case 'TOGGLE_DONE':
      return {
        ...state,
        tasks: state.tasks.map((task) => (task.id === action.payload.id ? toggleStatus(task) : task))
      };
    case 'SET_FILTER':
      return { ...state, filter: { ...state.filter, ...action.payload } };
    default:
      return state;
  }
};

export const useTaskStore = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await loadTasks();
      if (!mounted) return;
      dispatch({ type: 'HYDRATE', payload: stored ?? [] });
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    void persistTasks(state.tasks);
  }, [state.tasks, state.ready]);

  const filteredTasks = useMemo(() => filterTasks(state.tasks, state.filter), [state.tasks, state.filter]);
  const insights = useMemo(() => getTaskInsights(state.tasks), [state.tasks]);

  const addTask = (input: Parameters<typeof createTask>[0]) =>
    dispatch({ type: 'ADD', payload: createTask(input) });

  const updateTask = (id: Task['id'], patch: EditableTaskFields) =>
    dispatch({ type: 'UPDATE', payload: { id, patch } });

  const toggleTask = (id: Task['id']) => dispatch({ type: 'TOGGLE_DONE', payload: { id } });

  const completeTask = (id: Task['id']) => dispatch({ type: 'ADVANCE', payload: { id } });

  const removeTask = (id: Task['id']) => dispatch({ type: 'DELETE', payload: { id } });

  const setFilter = (next: Partial<TaskFilter>) => dispatch({ type: 'SET_FILTER', payload: next });

  return {
    ready: state.ready,
    tasks: state.tasks,
    filteredTasks,
    filter: state.filter,
    insights,
    addTask,
    updateTask,
    removeTask,
    toggleTask,
    completeTask,
    setFilter
  };
};
