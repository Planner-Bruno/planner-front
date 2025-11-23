import { API_BASE_URL } from '@/config/api';
import type { PlannerSnapshot } from '@/storage/plannerStorage';

const plannerEndpoint = `${API_BASE_URL}/planner/snapshot`;

const authHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`
});

const normalizeSnapshot = (payload: Partial<PlannerSnapshot> | null | undefined): PlannerSnapshot => ({
  tasks: payload?.tasks ?? [],
  goals: payload?.goals ?? [],
  events: payload?.events ?? [],
  marks: payload?.marks ?? [],
  notes: payload?.notes ?? [],
  categories: payload?.categories ?? []
});

export const fetchPlannerSnapshot = async (token: string): Promise<PlannerSnapshot | null> => {
  const response = await fetch(plannerEndpoint, {
    method: 'GET',
    headers: authHeaders(token)
  });

  if (response.status === 401) {
    throw new Error('Sessão expirada, faça login novamente');
  }

  if (!response.ok) {
    console.warn('Falha ao carregar snapshot remoto', await response.text());
    return null;
  }

  const data = (await response.json()) as Partial<PlannerSnapshot> | null;
  return normalizeSnapshot(data);
};

export const persistPlannerSnapshotRemote = async (token: string, snapshot: PlannerSnapshot): Promise<void> => {
  const response = await fetch(plannerEndpoint, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(snapshot)
  });

  if (!response.ok) {
    console.warn('Falha ao sincronizar snapshot remoto', await response.text());
  }
};
