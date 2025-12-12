import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FinanceCollectionName, FinanceEntityOf, FinanceOverview, FinanceSnapshot } from '@/types/finance';
import { createEmptyFinanceSnapshot } from '@/types/finance';
import { useAuth } from '@/state/AuthContext';
import {
  fetchFinanceSnapshot,
  replaceFinanceSnapshot,
  fetchFinanceOverview,
  listFinanceEntities,
  createFinanceEntity,
  updateFinanceEntity,
  deleteFinanceEntity
} from '@/services/financeApi';

interface FinanceStoreState {
  snapshot: FinanceSnapshot;
  overview: FinanceOverview | null;
  loadingSnapshot: boolean;
  loadingOverview: boolean;
  saving: boolean;
  error: string | null;
}

const buildInitialState = (): FinanceStoreState => ({
  snapshot: createEmptyFinanceSnapshot(),
  overview: null,
  loadingSnapshot: false,
  loadingOverview: false,
  saving: false,
  error: null
});

export const useFinanceStore = () => {
  const { token } = useAuth();
  const [state, setState] = useState<FinanceStoreState>(buildInitialState);

  const resetState = useCallback(() => {
    setState(buildInitialState());
  }, []);

  const refreshSnapshot = useCallback(async () => {
    if (!token) {
      resetState();
      return;
    }
    setState((prev) => ({ ...prev, loadingSnapshot: true, error: null }));
    try {
      const snapshot = await fetchFinanceSnapshot(token);
      setState((prev) => ({ ...prev, snapshot, loadingSnapshot: false }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loadingSnapshot: false,
        error: error instanceof Error ? error.message : 'Falha ao carregar finanças'
      }));
    }
  }, [token, resetState]);

  const refreshOverview = useCallback(async () => {
    if (!token) return;
    setState((prev) => ({ ...prev, loadingOverview: true }));
    try {
      const overview = await fetchFinanceOverview(token);
      setState((prev) => ({ ...prev, overview, loadingOverview: false }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loadingOverview: false,
        error: prev.error ?? (error instanceof Error ? error.message : 'Falha ao carregar visão financeira')
      }));
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      resetState();
      return;
    }
    void refreshSnapshot();
    void refreshOverview();
  }, [token, refreshSnapshot, refreshOverview, resetState]);

  const setSnapshot = useCallback((updater: (current: FinanceSnapshot) => FinanceSnapshot) => {
    setState((prev) => ({ ...prev, snapshot: updater(prev.snapshot) }));
  }, []);

  const updateCollection = useCallback(
    <T extends FinanceCollectionName>(collection: T, mutate: (items: FinanceEntityOf<T>[]) => FinanceEntityOf<T>[]) => {
      setSnapshot((current) => ({
        ...current,
        [collection]: mutate((current[collection] as FinanceEntityOf<T>[]) ?? [])
      }));
    },
    [setSnapshot]
  );

  const upsertLocalEntity = useCallback(
    <T extends FinanceCollectionName>(collection: T, entity: FinanceEntityOf<T>) => {
      updateCollection(collection, (items) => {
        const filtered = items.filter((item) => item.id !== entity.id);
        return [...filtered, entity];
      });
    },
    [updateCollection]
  );

  const deleteLocalEntity = useCallback(
    (collection: FinanceCollectionName, entityId: string) => {
      updateCollection(collection, (items) => items.filter((item) => item.id !== entityId));
    },
    [updateCollection]
  );

  const createEntity = useCallback(
    async <T extends FinanceCollectionName>(collection: T, payload: FinanceEntityOf<T>): Promise<FinanceEntityOf<T>> => {
      if (!token) throw new Error('Sessão expirada. Faça login novamente.');
      setState((prev) => ({ ...prev, saving: true }));
      try {
        const entity = await createFinanceEntity(token, collection, payload);
        upsertLocalEntity(collection, entity);
        return entity;
      } finally {
        setState((prev) => ({ ...prev, saving: false }));
      }
    },
    [token, upsertLocalEntity]
  );

  const patchEntity = useCallback(
    async <T extends FinanceCollectionName>(
      collection: T,
      entityId: string,
      payload: Partial<FinanceEntityOf<T>>
    ): Promise<FinanceEntityOf<T>> => {
      if (!token) throw new Error('Sessão expirada. Faça login novamente.');
      setState((prev) => ({ ...prev, saving: true }));
      try {
        const entity = await updateFinanceEntity(token, collection, entityId, payload);
        upsertLocalEntity(collection, entity);
        return entity;
      } finally {
        setState((prev) => ({ ...prev, saving: false }));
      }
    },
    [token, upsertLocalEntity]
  );

  const removeEntity = useCallback(
    async (collection: FinanceCollectionName, entityId: string): Promise<void> => {
      if (!token) throw new Error('Sessão expirada. Faça login novamente.');
      setState((prev) => ({ ...prev, saving: true }));
      try {
        await deleteFinanceEntity(token, collection, entityId);
        deleteLocalEntity(collection, entityId);
      } finally {
        setState((prev) => ({ ...prev, saving: false }));
      }
    },
    [token, deleteLocalEntity]
  );

  const replaceSnapshotRemote = useCallback(
    async (snapshot: FinanceSnapshot) => {
      if (!token) throw new Error('Sessão expirada. Faça login novamente.');
      setState((prev) => ({ ...prev, saving: true }));
      try {
        const updated = await replaceFinanceSnapshot(token, snapshot);
        setState((prev) => ({ ...prev, snapshot: updated, saving: false }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          saving: false,
          error: error instanceof Error ? error.message : 'Não foi possível salvar o snapshot financeiro'
        }));
        throw error;
      }
    },
    [token]
  );

  const getCollection = useCallback(
    <T extends FinanceCollectionName>(collection: T): FinanceEntityOf<T>[] =>
      (state.snapshot[collection] as FinanceEntityOf<T>[]) ?? [],
    [state.snapshot]
  );

  const loadCollection = useCallback(
    async <T extends FinanceCollectionName>(collection: T): Promise<FinanceEntityOf<T>[]> => {
      if (!token) throw new Error('Sessão expirada. Faça login novamente.');
      const items = await listFinanceEntities<T>(token, collection);
      setSnapshot((prev) => ({ ...prev, [collection]: items }));
      return items;
    },
    [token]
  );

  const derived = useMemo(
    () => ({
      netWorth: state.snapshot.wallets
        .filter((wallet) => wallet.include_in_net_worth !== false && wallet.archived !== true)
        .reduce((acc, wallet) => acc + wallet.balance, 0),
      latestTransactions: state.snapshot.transactions
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
    }),
    [state.snapshot]
  );

  return {
    snapshot: state.snapshot,
    overview: state.overview,
    loadingSnapshot: state.loadingSnapshot,
    loadingOverview: state.loadingOverview,
    saving: state.saving,
    error: state.error,
    derived,
    refreshSnapshot,
    refreshOverview,
    replaceSnapshot: replaceSnapshotRemote,
    getCollection,
    loadCollection,
    createEntity,
    patchEntity,
    removeEntity
  };
};
