export interface InstallmentPlan {
  _id: string;
  label: string;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
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
}

export interface UpdateInstallmentPlanDto {
  label?: string;
  installmentAmount?: number;
  totalInstallments?: number;
  paidInstallments?: number;
  startYearMonth?: string;
  dayOfMonth?: number;
  paymentMethodId?: string;
  currency?: string;
  isActive?: boolean;
}
