import type { PaymentMethodInstitution } from '@/types/payment-method';

export const FALLBACK_PAYMENT_METHOD_INSTITUTIONS: PaymentMethodInstitution[] =
  [
    { code: 'galicia', displayName: 'Banco Galicia', type: 'bank' },
    { code: 'nacion', displayName: 'Banco Nación', type: 'bank' },
    { code: 'provincia', displayName: 'Banco Provincia', type: 'bank' },
    { code: 'macro', displayName: 'Banco Macro', type: 'bank' },
    { code: 'bbva', displayName: 'BBVA', type: 'bank' },
    { code: 'brubank', displayName: 'Brubank', type: 'bank' },
    { code: 'icbc', displayName: 'ICBC', type: 'bank' },
    { code: 'santander', displayName: 'Santander', type: 'bank' },
    { code: 'supervielle', displayName: 'Supervielle', type: 'bank' },
    { code: 'ciudad', displayName: 'Banco Ciudad', type: 'bank' },
    { code: 'patagonia', displayName: 'Banco Patagonia', type: 'bank' },
    { code: 'hipotecario', displayName: 'Banco Hipotecario', type: 'bank' },
    { code: 'credicoop', displayName: 'Banco Credicoop', type: 'bank' },
    { code: 'comafi', displayName: 'Banco Comafi', type: 'bank' },
    { code: 'banco-del-sol', displayName: 'Banco del Sol', type: 'bank' },
    { code: 'bancor', displayName: 'Bancor', type: 'bank' },
    { code: 'banco-santa-fe', displayName: 'Banco Santa Fe', type: 'bank' },
    { code: 'belo', displayName: 'Belo', type: 'wallet' },
    { code: 'lemon', displayName: 'Lemon', type: 'wallet' },
    { code: 'mercado-pago', displayName: 'Mercado Pago', type: 'wallet' },
    { code: 'naranja-x', displayName: 'Naranja X', type: 'wallet' },
    { code: 'personal-pay', displayName: 'Personal Pay', type: 'wallet' },
    { code: 'prex', displayName: 'Prex', type: 'wallet' },
    { code: 'uala', displayName: 'Ualá', type: 'wallet' },
  ];

export const CUSTOM_PAYMENT_METHOD_INSTITUTION = '__other__';
