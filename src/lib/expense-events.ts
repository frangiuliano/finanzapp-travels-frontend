import { queryClient } from './query-client';

export const EXPENSES_CHANGED_EVENT = 'finanzapp:expenses-changed';

export function notifyExpensesChanged(): void {
  void queryClient.invalidateQueries({
    queryKey: ['home'],
    refetchType: 'none',
  });
  queueMicrotask(() => {
    window.dispatchEvent(new Event(EXPENSES_CHANGED_EVENT));
  });
}
