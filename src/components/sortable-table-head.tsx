import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { SortDirection } from '@/lib/table-sort';

interface SortableTableHeadProps<TColumn extends string> {
  column: TColumn;
  label: string;
  activeColumn: TColumn | null;
  direction: SortDirection;
  onSort: (column: TColumn) => void;
  className?: string;
  align?: 'left' | 'right';
}

export function SortableTableHead<TColumn extends string>({
  column,
  label,
  activeColumn,
  direction,
  onSort,
  className,
  align = 'left',
}: SortableTableHeadProps<TColumn>) {
  const isActive = activeColumn === column;
  const Icon = !isActive
    ? ArrowUpDown
    : direction === 'asc'
      ? ArrowUp
      : ArrowDown;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          'inline-flex items-center gap-1 rounded hover:text-foreground',
          align === 'right' && 'flex-row-reverse',
          isActive && 'text-foreground',
        )}
        aria-label={`Ordenar por ${label}`}
      >
        <span>{label}</span>
        <Icon className={cn('size-3.5', !isActive && 'opacity-40')} />
      </button>
    </TableHead>
  );
}
