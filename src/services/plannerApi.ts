import { API_BASE_URL } from '@/config/api';
import { normalizeSnapshot } from '@/storage/plannerStorage';
import type { PlannerSnapshot } from '@/storage/plannerStorage';
import type { SyncOperation as QueueOperation } from '@/storage/syncQueue';

const plannerEndpoint = `${API_BASE_URL}/planner/snapshot`;

const authHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`
});

export interface PlannerSyncConflictItem {
  operationId: string;
  reason: string;
}

export interface PlannerSyncResult {
  snapshot: PlannerSnapshot;
  appliedOperations: string[];
  conflicts: PlannerSyncConflictItem[];
}

export interface PlannerSyncRequestPayload {
  clientVersion: number;
  operations: QueueOperation[];
}

export class PlannerSyncConflict extends Error {
  constructor(public readonly serverSnapshot: PlannerSnapshot, message = 'Snapshot desatualizado no servidor') {
    super(message);
    this.name = 'PlannerSyncConflict';
  }
}

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

export const persistPlannerSnapshotRemote = async (token: string, snapshot: PlannerSnapshot): Promise<PlannerSnapshot | null> => {
  const response = await fetch(plannerEndpoint, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(snapshot)
  });

  if (response.status === 409) {
    const payload = await response.json().catch(() => ({}));
    if (payload?.snapshot) {
      throw new PlannerSyncConflict(normalizeSnapshot(payload.snapshot));
    }
    throw new PlannerSyncConflict(normalizeSnapshot(null));
  }

  if (!response.ok) {
    console.warn('Falha ao sincronizar snapshot remoto', await response.text());
    return null;
  }

  const data = (await response.json()) as Partial<PlannerSnapshot> | null;
  return normalizeSnapshot(data);
};

const syncEndpoint = `${API_BASE_URL}/planner/sync`;

type RawSyncResponse = {
  snapshot: Partial<PlannerSnapshot> | null;
  applied_operations?: string[];
  conflicts?: { operation_id: string; reason?: string }[];
};

const serializeOperation = (operation: QueueOperation) => ({
  id: operation.id,
  entity_type: operation.entityType,
  entity_id: operation.entityId ?? null,
  change_type: operation.changeType,
  payload: operation.payload ?? {},
  base_version: operation.baseVersion ?? null,
  timestamp: operation.timestamp
});

const normalizeConflicts = (conflicts?: RawSyncResponse['conflicts']): PlannerSyncConflictItem[] => {
  if (!conflicts?.length) return [];
  return conflicts.map((conflict) => ({
    operationId: conflict.operation_id,
    reason: conflict.reason ?? 'Operação não aplicada'
  }));
};

export const syncPlannerOperations = async (token: string, payload: PlannerSyncRequestPayload): Promise<PlannerSyncResult> => {
  const response = await fetch(syncEndpoint, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      client_version: payload.clientVersion,
      operations: payload.operations.map(serializeOperation)
    })
  });

  if (response.status === 409) {
    const body = await response.json().catch(() => ({}));
    if (body?.snapshot) {
      throw new PlannerSyncConflict(normalizeSnapshot(body.snapshot));
    }
    throw new PlannerSyncConflict(normalizeSnapshot(null));
  }

  if (!response.ok) {
    const text = await response.text().catch(() => 'Erro desconhecido');
    throw new Error(`Falha ao sincronizar fila: ${text}`);
  }

  const data = (await response.json()) as RawSyncResponse;
  return {
    snapshot: normalizeSnapshot(data?.snapshot ?? null),
    appliedOperations: data?.applied_operations ?? [],
    conflicts: normalizeConflicts(data?.conflicts)
  };
};
