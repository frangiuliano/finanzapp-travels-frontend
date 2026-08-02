export interface BillingPeriod {
  _id: string;
  paymentMethodId: string;
  userId: string;
  cycleLabel: string;
  periodFrom: string;
  periodTo: string;
  confirmedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingPeriodDefaults {
  paymentMethodId: string;
  paymentMethodName: string;
  cycleLabel: string;
  closingDay: number;
  periodFrom: string;
  periodTo: string;
  isConfirmed: boolean;
}

export interface ConfirmBillingPeriodDto {
  paymentMethodId: string;
  cycleLabel: string;
  periodFrom: string;
  periodTo: string;
}
