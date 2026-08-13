export const INCOMES_CHANGED_EVENT = 'finanzapp:incomes-changed';

export function notifyIncomesChanged(): void {
  queueMicrotask(() => {
    window.dispatchEvent(new Event(INCOMES_CHANGED_EVENT));
  });
}
