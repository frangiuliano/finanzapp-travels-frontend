export const EXPENSES_CHANGED_EVENT = 'finanzapp:expenses-changed';

export function notifyExpensesChanged(): void {
  window.dispatchEvent(new Event(EXPENSES_CHANGED_EVENT));
}
