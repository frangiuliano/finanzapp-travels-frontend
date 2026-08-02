function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function splitInstallmentAmounts(
  totalAmount: number,
  installments: number,
): number[] {
  if (installments < 1) {
    throw new Error('installments must be at least 1');
  }

  if (installments === 1) {
    return [roundMoney(totalAmount)];
  }

  const base = Math.floor((totalAmount / installments) * 100) / 100;
  const amounts = Array.from({ length: installments }, () => base);
  const sum = roundMoney(base * installments);
  const remainder = roundMoney(totalAmount - sum);
  amounts[installments - 1] = roundMoney(amounts[installments - 1] + remainder);
  return amounts;
}

export function getYearMonthFromIsoDate(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function getDayFromIsoDate(isoDate: string): number {
  const day = Number(isoDate.slice(8, 10));
  return Number.isFinite(day) && day >= 1 && day <= 31 ? day : 1;
}
