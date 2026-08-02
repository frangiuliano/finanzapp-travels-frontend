export type InAppNotificationType = 'billing_period_confirmation';

export interface InAppNotification {
  _id: string;
  type: InAppNotificationType;
  title: string;
  body: string;
  payload?: {
    paymentMethodId?: string;
    cycleLabel?: string;
    paymentMethodName?: string;
    [key: string]: unknown;
  };
  actionPath?: string;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
