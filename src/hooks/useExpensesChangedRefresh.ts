import { useEffect, useState } from 'react';
import { EXPENSES_CHANGED_EVENT } from '@/lib/expense-events';

export function useExpensesChangedRefresh(): number {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const onExpensesChanged = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener(EXPENSES_CHANGED_EVENT, onExpensesChanged);
    return () =>
      window.removeEventListener(EXPENSES_CHANGED_EVENT, onExpensesChanged);
  }, []);

  return refreshTrigger;
}
