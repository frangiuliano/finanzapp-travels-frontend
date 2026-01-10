export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'ARS',
  'BRL',
  'MXN',
  'COP',
  'CLP',
  'PEN',
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: SupportedCurrency = 'USD';

export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  USD: 'USD - Dólar Estadounidense',
  EUR: 'EUR - Euro',
  ARS: 'ARS - Peso Argentino',
  BRL: 'BRL - Real Brasileño',
  MXN: 'MXN - Peso Mexicano',
  COP: 'COP - Peso Colombiano',
  CLP: 'CLP - Peso Chileno',
  PEN: 'PEN - Sol Peruano',
};

export const CURRENCY_OPTIONS = SUPPORTED_CURRENCIES.map((currency) => ({
  value: currency,
  label: CURRENCY_LABELS[currency],
}));
