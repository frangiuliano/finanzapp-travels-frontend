export type PaymentMethodOwnerType = 'user' | 'board';
export type PaymentMethodKind = 'cash' | 'debit' | 'credit';

export interface PaymentMethod {
  _id: string;
  ownerType: PaymentMethodOwnerType;
  kind: PaymentMethodKind;
  userId?: string | { _id: string; firstName: string; lastName: string };
  tripId?: string | { _id: string; name: string };
  name: string;
  lastFourDigits?: string;
  brand?: string;
  closingDay?: number;
  dueDay?: number;
  isActive: boolean;
  migratedFromCardId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentMethodDto {
  ownerType: PaymentMethodOwnerType;
  kind: PaymentMethodKind;
  boardId?: string;
  tripId?: string;
  name: string;
  lastFourDigits?: string;
  brand?: string;
  closingDay?: number;
  dueDay?: number;
}

export interface UpdatePaymentMethodDto {
  name?: string;
  lastFourDigits?: string;
  brand?: string;
  closingDay?: number;
  dueDay?: number;
  isActive?: boolean;
}

export const PAYMENT_METHOD_KIND_LABELS: Record<PaymentMethodKind, string> = {
  cash: 'Efectivo',
  debit: 'Débito',
  credit: 'Crédito',
};

export const PAYMENT_METHOD_OWNER_LABELS: Record<
  PaymentMethodOwnerType,
  string
> = {
  user: 'Personal',
  board: 'Del tablero',
};
