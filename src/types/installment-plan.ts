export interface InstallmentPlan {
  _id: string;
  label: string;
  installmentAmount: number;
  totalInstallments: number;
  /** One-time seed used only at creation to know where materialization starts. Stale afterwards — don't display it. */
  paidInstallments: number;
  /** Live count of cuotas actually marked as paid right now. Use this for display. */
  paidCount: number;
  startYearMonth: string;
  dayOfMonth: number;
  paymentMethodId?: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateInstallmentPlanDto {
  boardId: string;
  label: string;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments?: number;
  startYearMonth: string;
  dayOfMonth: number;
  paymentMethodId?: string;
  currency?: string;
  fxRateOverride?: number;
}

export type InstallmentOverridePolicy = 'preserve' | 'replace';

export interface UpdateInstallmentPlanDto {
  label?: string;
  installmentAmount?: number;
  totalInstallments?: number;
  startYearMonth?: string;
  paymentMethodId?: string;
  currency?: string;
  isActive?: boolean;
  /** Purely informational — which day of the month each cuota displays. */
  dayOfMonth?: number;
  /** Confirmation sent only after the server reports a `customOverrides` decision is needed. */
  overridePolicy?: InstallmentOverridePolicy;
}

export interface InstallmentCustomOverrideItem {
  installmentNumber: number;
  description: string;
  amount: number;
  currency: string;
  overriddenFields: string[];
}

export interface InstallmentCustomOverridesInfo {
  count: number;
  items: InstallmentCustomOverrideItem[];
}

export interface InstallmentPlanUpdateNeedsDecision {
  status: 'needs_decision';
  customOverrides: InstallmentCustomOverridesInfo;
}

export interface InstallmentPlanUpdateApplied {
  status: 'applied';
  message: string;
  installmentPlan: InstallmentPlan;
  applied: {
    datesUpdated: number;
    overridePolicy?: InstallmentOverridePolicy;
    overridesPreserved: number;
    overridesReplaced: number;
  };
}

export type InstallmentPlanUpdateResult =
  | InstallmentPlanUpdateNeedsDecision
  | InstallmentPlanUpdateApplied;

export type InstallmentRescheduleScope = 'this' | 'this_and_future' | 'all';

export interface RescheduleInstallmentDto {
  installmentNumber?: number;
  /** Required unless `targetYearMonth` is set — day is then always derived server-side. */
  dayOfMonth?: number;
  /** Moves the anchor cuota's month instead of syncing its day. Not valid for scope "all". */
  targetYearMonth?: string;
  scope: InstallmentRescheduleScope;
}
