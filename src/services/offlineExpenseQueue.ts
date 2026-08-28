import type { CreateExpenseDto } from '@/types/expense';

const DB_NAME = 'finanzapp-offline';
const STORE_NAME = 'expense-queue';
const DB_VERSION = 1;

/**
 * Entries older than this are discarded on read instead of kept indefinitely
 * on disk — they hold unsynced expense data (amounts, descriptions) and the
 * user may never explicitly log out to trigger the existing logout cleanup.
 */
export const STALE_ENTRY_TTL_MS = 72 * 60 * 60 * 1000;

export interface QueuedExpenseEntry {
  clientRequestId: string;
  userId: string;
  payload: CreateExpenseDto;
  enqueuedAt: string;
  retryCount: number;
  lastError?: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'clientRequestId',
        });
        store.createIndex('enqueuedAt', 'enqueuedAt', { unique: false });
        store.createIndex('userId', 'userId', { unique: false });
      }
    };
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const request = fn(store);

        let result: T;

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          result = request.result as T;
        };

        tx.oncomplete = () => {
          db.close();
          resolve(result);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      }),
  );
}

export const offlineExpenseQueue = {
  async enqueue(entry: QueuedExpenseEntry): Promise<void> {
    await runTransaction('readwrite', (store) => store.put(entry));
    notifyQueueListeners();
  },

  async getAllForUser(userId: string): Promise<QueuedExpenseEntry[]> {
    const entries = await runTransaction<QueuedExpenseEntry[]>(
      'readonly',
      (store) => store.getAll(),
    );
    return entries.filter((entry) => entry.userId === userId);
  },

  async countForUser(userId: string): Promise<number> {
    const entries = await this.getAllForUser(userId);
    return entries.length;
  },

  async remove(clientRequestId: string): Promise<void> {
    await runTransaction('readwrite', (store) => store.delete(clientRequestId));
    notifyQueueListeners();
  },

  async clearForUser(userId: string): Promise<void> {
    const entries = await this.getAllForUser(userId);
    await Promise.all(
      entries.map((entry) => this.remove(entry.clientRequestId)),
    );
  },

  /**
   * Discards entries older than STALE_ENTRY_TTL_MS. Independent of logout,
   * since a shared/lost device may never trigger that cleanup.
   */
  async purgeStaleEntries(
    userId: string,
    now: number = Date.now(),
  ): Promise<QueuedExpenseEntry[]> {
    const entries = await this.getAllForUser(userId);
    const stale = entries.filter(
      (entry) =>
        now - new Date(entry.enqueuedAt).getTime() > STALE_ENTRY_TTL_MS,
    );
    await Promise.all(stale.map((entry) => this.remove(entry.clientRequestId)));
    return stale;
  },

  async markFailed(
    clientRequestId: string,
    lastError: string,
    retryCount: number,
  ): Promise<void> {
    const entries = await runTransaction<QueuedExpenseEntry[]>(
      'readonly',
      (store) => store.getAll(),
    );
    const entry = entries.find(
      (item) => item.clientRequestId === clientRequestId,
    );
    if (!entry) return;

    await this.enqueue({
      ...entry,
      lastError,
      retryCount,
    });
  },
};

type QueueListener = (count: number) => void;
const queueListeners = new Set<QueueListener>();
let activeUserId: string | null = null;

function notifyQueueListeners(): void {
  if (!activeUserId) return;
  void offlineExpenseQueue.countForUser(activeUserId).then((count) => {
    queueListeners.forEach((listener) => listener(count));
  });
}

export function subscribeOfflineQueue(
  userId: string,
  listener: QueueListener,
): () => void {
  activeUserId = userId;
  queueListeners.add(listener);
  void offlineExpenseQueue
    .countForUser(userId)
    .then((count) => listener(count));

  return () => {
    queueListeners.delete(listener);
  };
}
