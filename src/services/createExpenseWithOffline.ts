import { AxiosError } from 'axios';
import { expensesService } from '@/services/expensesService';
import { offlineExpenseQueue } from '@/services/offlineExpenseQueue';
import { useAuthStore } from '@/store/authStore';
import type { CreateExpenseDto, Expense } from '@/types/expense';

export type CreateExpenseResult =
  | { mode: 'online'; expense: Expense }
  | { mode: 'queued'; clientRequestId: string };

export function isRetryableNetworkError(error: unknown): boolean {
  if (!navigator.onLine) {
    return true;
  }

  if (error instanceof AxiosError) {
    return !error.response;
  }

  return false;
}

function getCurrentUserId(): string {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    throw new Error('Usuario no autenticado');
  }
  return userId;
}

export async function createExpenseWithOffline(
  data: CreateExpenseDto,
): Promise<CreateExpenseResult> {
  const clientRequestId = crypto.randomUUID();
  const userId = getCurrentUserId();
  const payload: CreateExpenseDto = { ...data, clientRequestId };

  if (navigator.onLine) {
    try {
      const result = await expensesService.createExpense(
        payload,
        clientRequestId,
      );
      return { mode: 'online', expense: result.expense };
    } catch (error) {
      if (!isRetryableNetworkError(error)) {
        throw error;
      }
    }
  }

  await offlineExpenseQueue.enqueue({
    clientRequestId,
    userId,
    payload,
    enqueuedAt: new Date().toISOString(),
    retryCount: 0,
  });

  if (navigator.onLine) {
    await processOfflineExpenseQueue();
  }

  return { mode: 'queued', clientRequestId };
}

export async function processOfflineExpenseQueue(): Promise<number> {
  if (!navigator.onLine) {
    return 0;
  }

  const userId = useAuthStore.getState().user?.id;
  if (!userId) {
    return 0;
  }

  const entries = await offlineExpenseQueue.getAllForUser(userId);
  const sorted = [...entries].sort((a, b) =>
    a.enqueuedAt.localeCompare(b.enqueuedAt),
  );

  let synced = 0;

  for (const entry of sorted) {
    try {
      await expensesService.createExpense(entry.payload, entry.clientRequestId);
      await offlineExpenseQueue.remove(entry.clientRequestId);
      synced += 1;
    } catch (error) {
      if (isRetryableNetworkError(error)) {
        break;
      }

      const message =
        error instanceof AxiosError
          ? error.response?.data?.message || error.message
          : 'Error al sincronizar';

      await offlineExpenseQueue.markFailed(
        entry.clientRequestId,
        message,
        entry.retryCount + 1,
      );
      break;
    }
  }

  return synced;
}
