import { TagIcon, UsersIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getExpenseCategoryLabel, type Expense } from '@/types/expense';

interface TripExpenseDistributionProps {
  expenses: Expense[];
  currency: string;
  mode: 'categories' | 'participants';
}

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

export function TripExpenseDistribution({
  expenses,
  currency,
  mode,
}: TripExpenseDistributionProps) {
  const totals = new Map<string, number>();

  expenses.forEach((expense) => {
    const label =
      mode === 'categories'
        ? getExpenseCategoryLabel(expense.category) || 'Sin categoría'
        : expense.paidByParticipant?.guestName ||
          (expense.paidByParticipant?.userId
            ? `${expense.paidByParticipant.userId.firstName} ${expense.paidByParticipant.userId.lastName}`
            : 'Sin asignar');
    totals.set(label, (totals.get(label) || 0) + expense.amount);
  });

  const rows = Array.from(totals, ([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const isCategories = mode === 'categories';

  return (
    <Card>
      <CardHeader className="px-4 pb-3 sm:px-6">
        <div className="flex items-center gap-2">
          {isCategories ? (
            <TagIcon className="size-4 text-muted-foreground" />
          ) : (
            <UsersIcon className="size-4 text-muted-foreground" />
          )}
          <CardTitle className="text-base sm:text-lg">
            {isCategories ? 'Distribución por categoría' : 'Pagado por persona'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {rows.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            {isCategories
              ? 'Las categorías aparecerán cuando registres el primer gasto.'
              : 'La distribución aparecerá cuando registres el primer gasto.'}
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const percentage = total > 0 ? (row.amount / total) * 100 : 0;
              return (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{row.label}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatCurrency(row.amount, currency)}
                    </span>
                  </div>
                  <Progress
                    value={percentage}
                    aria-label={`${row.label}: ${percentage.toFixed(0)}%`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
