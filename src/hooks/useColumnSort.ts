import { useState } from 'react';
import type { SortDirection } from '@/lib/table-sort';

/**
 * Click a column to sort by it ascending; click again to flip to
 * descending; click a third time to clear the sort and go back to
 * whatever order the data originally came in.
 */
export function useColumnSort<TColumn extends string>() {
  const [sortColumn, setSortColumn] = useState<TColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const toggleSort = (column: TColumn) => {
    if (sortColumn !== column) {
      setSortColumn(column);
      setSortDirection('asc');
      return;
    }
    if (sortDirection === 'asc') {
      setSortDirection('desc');
      return;
    }
    setSortColumn(null);
    setSortDirection('asc');
  };

  return { sortColumn, sortDirection, toggleSort };
}
