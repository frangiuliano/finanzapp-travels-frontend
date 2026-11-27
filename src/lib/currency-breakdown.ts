import type { CurrencyBreakdownEntry } from '@/types/currency-breakdown';

/** Sums same-currency entries across multiple breakdowns (e.g. actual + planned), without converting between currencies. */
export function mergeCurrencyBreakdowns(
  ...breakdowns: CurrencyBreakdownEntry[][]
): CurrencyBreakdownEntry[] {
  const totals = new Map<string, { total: number; count: number }>();

  for (const breakdown of breakdowns) {
    for (const entry of breakdown) {
      const bucket = totals.get(entry.currency) ?? { total: 0, count: 0 };
      bucket.total += entry.total;
      bucket.count += entry.count;
      totals.set(entry.currency, bucket);
    }
  }

  return [...totals.entries()].map(([currency, data]) => ({
    currency,
    total: data.total,
    count: data.count,
  }));
}
