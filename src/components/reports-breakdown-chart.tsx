import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';
import type { CurrencyBreakdownEntry } from '@/types/currency-breakdown';

export interface BreakdownChartItem {
  id: string;
  label: string;
  total: number;
  count: number;
  otherCurrencyTotals?: CurrencyBreakdownEntry[];
}

interface ReportsBreakdownChartProps {
  title: string;
  description: string;
  items: BreakdownChartItem[];
  currency: string;
  emptyMessage: string;
}

const chartConfig = {
  total: {
    label: 'Total',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

const MIN_SEGMENTS_FOR_CHART = 4;

export function ReportsBreakdownChart({
  title,
  description,
  items,
  currency,
  emptyMessage,
}: ReportsBreakdownChartProps) {
  const chartData = items
    .filter(
      (item) =>
        item.total > 0 ||
        item.otherCurrencyTotals?.some((entry) => entry.total > 0),
    )
    .sort((a, b) => b.total - a.total)
    .map((item) => ({
      id: item.id,
      label:
        item.label.length > 18 ? `${item.label.slice(0, 16)}…` : item.label,
      fullLabel: item.label,
      total: item.total,
      count: item.count,
      otherCurrencyTotals: item.otherCurrencyTotals ?? [],
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-4">
            {chartData.length >= MIN_SEGMENTS_FOR_CHART && (
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[min(280px,50vh)] w-full"
              >
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 4, right: 12, top: 4, bottom: 4 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={88}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        formatter={(value, _name, item) => (
                          <div className="flex w-full items-center justify-between gap-4">
                            <span className="text-muted-foreground">
                              {
                                (item.payload as { fullLabel: string })
                                  .fullLabel
                              }
                            </span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatCurrency(Number(value), currency)}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar
                    dataKey="total"
                    fill="var(--color-total)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}

            <ul className="divide-y text-sm">
              {chartData.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.fullLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.count} movimiento{item.count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {item.total > 0 || item.otherCurrencyTotals.length === 0 ? (
                      <p className="font-medium tabular-nums">
                        {formatCurrency(item.total, currency)}
                      </p>
                    ) : null}
                    {item.otherCurrencyTotals.map((entry) => (
                      <p
                        key={entry.currency}
                        className="text-xs text-muted-foreground tabular-nums"
                      >
                        {formatCurrency(entry.total, entry.currency)}
                      </p>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
