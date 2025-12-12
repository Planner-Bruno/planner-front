import { API_BASE_URL } from '@/config/api';
import type { FinanceCollectionName, FinanceEntityOf, FinanceOverview, FinanceSnapshot } from '@/types/finance';
import { createEmptyFinanceSnapshot } from '@/types/finance';

const financeEndpoint = `${API_BASE_URL}/finance`;

const authHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`
});

const normalizeSnapshot = (payload?: Partial<FinanceSnapshot> | null): FinanceSnapshot => {
  const base = createEmptyFinanceSnapshot();
  if (!payload) return base;
  return {
    wallets: Array.isArray(payload.wallets) ? payload.wallets : base.wallets,
    categories: Array.isArray(payload.categories) ? payload.categories : base.categories,
    transactions: Array.isArray(payload.transactions) ? payload.transactions : base.transactions,
    budgets: Array.isArray(payload.budgets) ? payload.budgets : base.budgets,
    goals: Array.isArray(payload.goals) ? payload.goals : base.goals,
    recurring_rules: Array.isArray(payload.recurring_rules) ? payload.recurring_rules : base.recurring_rules
  };
};

const ensureOk = async (response: Response) => {
  if (response.ok) return;
  const message = await response.text().catch(() => 'Erro desconhecido');
  throw new Error(message || 'Falha na requisição financeira');
};

export const fetchFinanceSnapshot = async (token: string): Promise<FinanceSnapshot> => {
  const response = await fetch(`${financeEndpoint}/snapshot`, {
    method: 'GET',
    headers: authHeaders(token)
  });
  await ensureOk(response);
  const payload = (await response.json().catch(() => null)) as Partial<FinanceSnapshot> | null;
  return normalizeSnapshot(payload);
};

export const replaceFinanceSnapshot = async (token: string, snapshot: FinanceSnapshot): Promise<FinanceSnapshot> => {
  const response = await fetch(`${financeEndpoint}/snapshot`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(snapshot)
  });
  await ensureOk(response);
  const payload = (await response.json().catch(() => null)) as Partial<FinanceSnapshot> | null;
  return normalizeSnapshot(payload);
};

export const fetchFinanceOverview = async (token: string): Promise<FinanceOverview> => {
  const response = await fetch(`${financeEndpoint}/overview`, {
    method: 'GET',
    headers: authHeaders(token)
  });
  await ensureOk(response);
  return (await response.json()) as FinanceOverview;
};

export const listFinanceEntities = async <T extends FinanceCollectionName>(
  token: string,
  collection: T
): Promise<FinanceEntityOf<T>[]> => {
  const response = await fetch(`${financeEndpoint}/${collection}`, {
    method: 'GET',
    headers: authHeaders(token)
  });
  await ensureOk(response);
  return (await response.json()) as FinanceEntityOf<T>[];
};

export const createFinanceEntity = async <T extends FinanceCollectionName>(
  token: string,
  collection: T,
  payload: Partial<FinanceEntityOf<T>> & { id: string }
): Promise<FinanceEntityOf<T>> => {
  const response = await fetch(`${financeEndpoint}/${collection}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
  await ensureOk(response);
  return (await response.json()) as FinanceEntityOf<T>;
};

export const updateFinanceEntity = async <T extends FinanceCollectionName>(
  token: string,
  collection: T,
  entityId: string,
  payload: Partial<FinanceEntityOf<T>>
): Promise<FinanceEntityOf<T>> => {
  const response = await fetch(`${financeEndpoint}/${collection}/${entityId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload)
  });
  await ensureOk(response);
  return (await response.json()) as FinanceEntityOf<T>;
};

export const deleteFinanceEntity = async (
  token: string,
  collection: FinanceCollectionName,
  entityId: string
): Promise<void> => {
  const response = await fetch(`${financeEndpoint}/${collection}/${entityId}`, {
    method: 'DELETE',
    headers: authHeaders(token)
  });
  await ensureOk(response);
};
