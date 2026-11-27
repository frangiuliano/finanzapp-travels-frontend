export type SortDirection = 'asc' | 'desc';

/**
 * Compares two sortable values (numbers, or strings — ISO dates included,
 * since `YYYY-MM-DD`/ISO datetimes sort correctly as plain strings).
 */
export function compareSortValues(
  a: string | number,
  b: string | number,
  direction: SortDirection,
): number {
  const result =
    typeof a === 'number' && typeof b === 'number'
      ? a - b
      : String(a).localeCompare(String(b), 'es', { sensitivity: 'base' });
  return direction === 'asc' ? result : -result;
}
