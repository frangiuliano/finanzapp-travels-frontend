import {
  PAYMENT_METHOD_KIND_LABELS,
  PaymentMethod,
} from '@/types/payment-method';

export function formatPaymentMethodLabel(method: PaymentMethod): string {
  if (method.kind === 'cash') {
    return method.name;
  }

  const parts = [method.name];
  if (method.lastFourDigits) {
    parts.push(`•••• ${method.lastFourDigits}`);
  } else {
    parts.push(PAYMENT_METHOD_KIND_LABELS[method.kind]);
  }

  return parts.join(' · ');
}
