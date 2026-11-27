export type InsightType =
  | 'total_variation'
  | 'category_increase'
  | 'category_decrease'
  | 'category_new'
  | 'installment_started'
  | 'installment_finished'
  | 'projected_variation'
  | 'insufficient_data'
  | 'no_activity'
  | 'future_month';

export type InsightSeverity = 'positive' | 'negative' | 'neutral';

export type MonthStatus = 'complete_past' | 'current_partial' | 'future';

export type ComparisonMode =
  | 'full_month'
  | 'same_day_range'
  | 'projected_vs_plan'
  | 'none';

export interface Insight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  /** Populated only for installment_started/installment_finished. */
  installmentPlanId: string | null;
  installmentPlanLabel: string | null;
  currency: string;
  currentAmount: number | null;
  previousAmount: number | null;
  absoluteChange: number | null;
  percentChange: number | null;
  currentPeriod: string;
  previousPeriod: string | null;
}

export interface MonthlyInsightsResponse {
  boardId: string;
  currency: string;
  currentPeriod: string;
  previousPeriod: string | null;
  monthStatus: MonthStatus;
  comparisonMode: ComparisonMode;
  insights: Insight[];
}

/** The 3 "status" insight types carry no amounts and should never be reused as Home's single top insight. */
export const STATUS_INSIGHT_TYPES: ReadonlySet<InsightType> = new Set([
  'insufficient_data',
  'no_activity',
  'future_month',
]);
