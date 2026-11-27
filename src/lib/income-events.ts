import { queryClient } from './query-client';

export const INCOMES_CHANGED_EVENT = 'finanzapp:incomes-changed';

export function notifyIncomesChanged(): void {
  void queryClient.invalidateQueries({
    queryKey: ['home'],
    refetchType: 'none',
  });
  queueMicrotask(() => {
    window.dispatchEvent(new Event(INCOMES_CHANGED_EVENT));
  });
}
