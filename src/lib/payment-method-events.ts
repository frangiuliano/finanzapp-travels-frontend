export const PAYMENT_METHODS_CHANGED_EVENT =
  'finanzapp:payment-methods-changed';

export interface PaymentMethodsChangedDetail {
  boardId?: string;
}

export function notifyPaymentMethodsChanged(boardId?: string): void {
  window.dispatchEvent(
    new CustomEvent<PaymentMethodsChangedDetail>(
      PAYMENT_METHODS_CHANGED_EVENT,
      {
        detail: { boardId },
      },
    ),
  );
}
