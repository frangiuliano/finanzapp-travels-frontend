import { useEffect, useState } from 'react';
import { INCOMES_CHANGED_EVENT } from '@/lib/income-events';

export function useIncomesChangedRefresh(): number {
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const handleChange = () => setRefresh((current) => current + 1);
    window.addEventListener(INCOMES_CHANGED_EVENT, handleChange);
    return () =>
      window.removeEventListener(INCOMES_CHANGED_EVENT, handleChange);
  }, []);

  return refresh;
}
