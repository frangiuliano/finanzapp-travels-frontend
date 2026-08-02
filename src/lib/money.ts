const MONEY_INPUT_PATTERN = /[^\d,.]/g;

export function formatMoneyInputString(input: string): string {
  const sanitized = input.replace(MONEY_INPUT_PATTERN, '');
  if (!sanitized) return '';

  const lastComma = sanitized.lastIndexOf(',');
  const lastDot = sanitized.lastIndexOf('.');
  const decimalSeparatorIndex = Math.max(lastComma, lastDot);

  let integerRaw: string;
  let decimalRaw: string | undefined;
  let hasDecimal = false;

  if (decimalSeparatorIndex !== -1) {
    const afterSeparator = sanitized
      .slice(decimalSeparatorIndex + 1)
      .replace(/[,.]/g, '');
    const beforeSeparator = sanitized
      .slice(0, decimalSeparatorIndex)
      .replace(/[,.]/g, '');

    if (afterSeparator.length <= 2) {
      integerRaw = beforeSeparator;
      decimalRaw = afterSeparator;
      hasDecimal = true;
    } else {
      integerRaw = sanitized.replace(/[,.]/g, '');
    }
  } else {
    integerRaw = sanitized.replace(/[,.]/g, '');
  }

  if (!integerRaw && !hasDecimal) return '';

  const formattedInteger = integerRaw
    ? integerRaw.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    : '0';

  if (!hasDecimal) {
    return formattedInteger;
  }

  const trailingSeparator = decimalSeparatorIndex === sanitized.length - 1;
  if (trailingSeparator) {
    return `${integerRaw ? formattedInteger : '0'},`;
  }

  return `${integerRaw ? formattedInteger : '0'},${decimalRaw ?? ''}`;
}

export function parseMoneyInput(value: string): number | null {
  const formatted = formatMoneyInputString(value);
  if (!formatted) return null;

  const [integerPart, decimalPart] = formatted.split(',');
  const integerValue = Number.parseInt(integerPart.replace(/\./g, ''), 10);
  if (Number.isNaN(integerValue)) return null;

  if (decimalPart === undefined) {
    return integerValue;
  }

  if (!decimalPart) {
    return integerValue;
  }

  const decimalValue = Number(decimalPart);
  if (Number.isNaN(decimalValue)) {
    return integerValue;
  }

  return integerValue + decimalValue / 10 ** decimalPart.length;
}

export function formatMoneyInputFromNumber(amount: number): string {
  if (!Number.isFinite(amount)) return '';

  const [integerPart, decimalPart] = amount.toFixed(2).split('.');
  const formattedInteger = Number(integerPart).toLocaleString('es-ES', {
    maximumFractionDigits: 0,
  });
  const trimmedDecimal = decimalPart.replace(/0+$/, '');

  if (!trimmedDecimal) {
    return formattedInteger;
  }

  return `${formattedInteger},${trimmedDecimal}`;
}
