import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Info,
  PlusCircle,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Insight, InsightType } from '@/types/insight';

const ICON_BY_TYPE: Record<InsightType, typeof Info> = {
  total_variation: TrendingUp,
  category_increase: ArrowUpRight,
  category_decrease: ArrowDownRight,
  category_new: Sparkles,
  installment_finished: CheckCircle2,
  installment_started: PlusCircle,
  projected_variation: TrendingUp,
  insufficient_data: Info,
  no_activity: Wallet,
  future_month: CalendarClock,
};

// total_variation and projected_variation both swap to TrendingDown when the
// tone is positive (spend down), so the icon — not just color — carries
// direction.
const DIRECTIONAL_TYPES: ReadonlySet<InsightType> = new Set([
  'total_variation',
  'projected_variation',
]);

const SEVERITY_CLASSES: Record<Insight['severity'], string> = {
  positive: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  negative: 'bg-destructive/10 text-destructive',
  neutral: 'bg-primary/10 text-primary',
};

interface InsightRowProps {
  insight: Insight;
  compact?: boolean;
  className?: string;
}

export function InsightRow({ insight, compact, className }: InsightRowProps) {
  // Plain map lookup, never a fresh component (see DIRECTIONAL_TYPES above).
  const Icon =
    DIRECTIONAL_TYPES.has(insight.type) && insight.severity === 'positive'
      ? TrendingDown
      : ICON_BY_TYPE[insight.type];

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full',
          compact ? 'size-7' : 'size-9',
          SEVERITY_CLASSES[insight.severity],
        )}
      >
        <Icon className={compact ? 'size-3.5' : 'size-4'} aria-hidden />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        {!compact && (
          <p className="text-sm font-medium leading-tight [overflow-wrap:anywhere]">
            {insight.title}
          </p>
        )}
        <p
          className={cn(
            'leading-snug text-muted-foreground [overflow-wrap:anywhere]',
            compact ? 'text-xs' : 'text-sm',
          )}
        >
          {insight.description}
        </p>
      </div>
    </div>
  );
}
