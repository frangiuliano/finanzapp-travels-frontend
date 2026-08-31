import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface StatStripItem {
  label: string;
  value: ReactNode;
  currency?: string;
  sign?: '+' | '−';
  description?: string;
  negative?: boolean;
}

/** Exact values stay visible, including on narrow screens (no abbreviated totals). */
export function StatStrip({
  items,
  loading = false,
  centered = false,
}: {
  items: StatStripItem[];
  loading?: boolean;
  centered?: boolean;
}) {
  return (
    <dl
      aria-label="Resumen"
      aria-busy={loading}
      className={cn(
        'grid overflow-hidden rounded-2xl border bg-card py-4 shadow-xs',
        centered && 'grid-rows-[auto_auto_auto_auto] gap-y-1',
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            'min-w-0 border-l px-2 first:border-l-0 sm:px-5',
            centered && 'row-span-4 grid grid-rows-subgrid text-center',
          )}
        >
          <dt
            className={cn(
              'text-xs text-muted-foreground sm:text-sm',
              centered && 'flex items-center justify-center',
            )}
          >
            {item.label}
          </dt>
          <dd
            className={cn(
              'mt-1 font-semibold tabular-nums [overflow-wrap:anywhere] sm:text-xl',
              items.length > 2 ? 'text-xs' : 'text-sm',
              item.negative && 'text-destructive',
              centered && 'row-start-2 mt-0',
            )}
          >
            {loading
              ? '—'
              : item.currency && typeof item.value === 'number'
                ? `${item.sign ?? ''}${new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: item.currency,
                  })
                    .formatToParts(item.value)
                    .filter((part) => part.type !== 'currency')
                    .map((part) => part.value)
                    .join('')
                    .trim()}`
                : typeof item.value === 'string'
                  ? item.value.replace(/\u00a0/g, ' ')
                  : item.value}
          </dd>
          {item.currency && (
            <dd className="row-start-3 text-xs text-muted-foreground">
              {item.currency}
            </dd>
          )}
          {item.description && (
            <dd
              className={cn(
                'mt-2 text-xs text-muted-foreground [overflow-wrap:anywhere]',
                centered && 'row-start-4',
              )}
            >
              {item.description}
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}
