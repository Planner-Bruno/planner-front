import { beforeEach, describe, expect, it, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { enqueueOperation, loadSyncQueue, removeOperations, replaceQueue, type SyncOperation } from '@/storage/syncQueue';

vi.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    default: {
      async getItem(key: string) {
        return store[key] ?? null;
      },
      async setItem(key: string, value: string) {
        store[key] = value;
      },
      async removeItem(key: string) {
        delete store[key];
      },
      __reset() {
        store = {};
      }
    }
  };
});

type AsyncStorageMock = typeof AsyncStorage & { __reset: () => void };

const getMockStorage = () => AsyncStorage as AsyncStorageMock;

const makeOperation = (id: string, timestamp: string, patch?: Partial<SyncOperation>): SyncOperation => ({
  id,
  entityType: 'tasks',
  entityId: id,
  changeType: 'update',
  timestamp,
  ...patch
});

describe('syncQueue storage helpers', () => {
  beforeEach(() => {
    getMockStorage().__reset();
  });

  it('orders operations by timestamp and avoids duplicates', async () => {
    const older = makeOperation('op-old', '2024-01-01T00:00:00.000Z');
    const newer = makeOperation('op-new', '2024-01-02T00:00:00.000Z');
    const updatedOlder = makeOperation('op-old', '2024-02-01T00:00:00.000Z', { payload: { title: 'Atualizado' } });

    await enqueueOperation(newer);
    await enqueueOperation(older);

    let queue = await loadSyncQueue();
    expect(queue.map((item) => item.id)).toEqual(['op-old', 'op-new']);

    await enqueueOperation(updatedOlder);
    queue = await loadSyncQueue();
    expect(queue).toHaveLength(2);
    expect(queue.find((item) => item.id === 'op-old')?.payload).toEqual({ title: 'Atualizado' });
    expect(queue.map((item) => item.id)).toEqual(['op-new', 'op-old']);
  });

  it('removes requested operations and keeps remaining sorted', async () => {
    const base = [
      makeOperation('op-a', '2024-03-01T12:00:00.000Z'),
      makeOperation('op-b', '2024-03-01T12:05:00.000Z'),
      makeOperation('op-c', '2024-03-01T12:10:00.000Z')
    ];
    await replaceQueue(base);

    await removeOperations(['op-b']);

    const queue = await loadSyncQueue();
    expect(queue.map((item) => item.id)).toEqual(['op-a', 'op-c']);
  });
});
