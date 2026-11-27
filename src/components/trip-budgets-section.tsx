import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Budget } from '@/types/budget';
import { Expense } from '@/types/expense';
import { CreateBudgetDialog } from './create-budget-dialog';
import { toast } from 'sonner';
import { budgetsService } from '@/services/budgetsService';
import { requestConfirmation } from '@/lib/confirmation-events';

interface TripBudgetsSectionProps {
  tripId: string;
  tripName: string;
  budgets: Budget[];
  expenses: Expense[];
  onBudgetsChange: () => void;
}

export function TripBudgetsSection({
  tripId,
  tripName,
  budgets,
  expenses,
  onBudgetsChange,
}: TripBudgetsSectionProps) {
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const formatCurrency = (amount: number, budgetCurrency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: budgetCurrency,
    }).format(amount);
  };

  const handleCreateBudget = () => {
    setSelectedBudget(null);
    setIsBudgetDialogOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsBudgetDialogOpen(true);
  };

  const handleDeleteBudget = async (budget: Budget) => {
    if (
      !(await requestConfirmation({
        title: '¿Eliminar presupuesto?',
        description: `Se eliminará “${budget.name}”. Los gastos del viaje se conservarán.`,
        confirmLabel: 'Eliminar presupuesto',
      }))
    ) {
      return;
    }

    try {
      await budgetsService.deleteBudget(budget._id);
      toast.success('Presupuesto eliminado exitosamente');
      onBudgetsChange();
    } catch (error) {
      console.error('Error al eliminar presupuesto:', error);
      toast.error('Error al eliminar el presupuesto');
    }
  };

  const getBudgetSpent = (budgetId: string) => {
    return expenses
      .filter((expense) => expense.budgetId === budgetId)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getBudgetUsage = (budget: Budget) => {
    const spent = getBudgetSpent(budget._id);
    return budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Presupuestos del viaje</CardTitle>
              <CardDescription>
                Presupuestos asignados para {tripName}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateBudget}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear Presupuesto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No hay presupuestos creados para este viaje
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateBudget}
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear tu primer presupuesto
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {budgets.map((budget) => {
                  const spent = getBudgetSpent(budget._id);
                  const usage = getBudgetUsage(budget);

                  return (
                    <article
                      key={budget._id}
                      className="rounded-xl border bg-card p-4 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-medium">
                            {budget.name}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Gastado: {formatCurrency(spent, budget.currency)}
                          </p>
                        </div>
                        <strong className="shrink-0 tabular-nums">
                          {formatCurrency(budget.amount, budget.currency)}
                        </strong>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Progress value={usage} className="flex-1" />
                        <span className="w-10 text-right text-xs font-medium tabular-nums">
                          {usage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="mt-3 flex justify-end gap-1 border-t pt-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-11"
                          onClick={() => handleEditBudget(budget)}
                          aria-label={`Editar ${budget.name}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-11"
                          onClick={() => void handleDeleteBudget(budget)}
                          aria-label={`Eliminar ${budget.name}`}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Presupuesto</TableHead>
                    <TableHead>Gastado</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.map((budget) => {
                    const spent = getBudgetSpent(budget._id);
                    const usage = getBudgetUsage(budget);

                    return (
                      <TableRow key={budget._id}>
                        <TableCell className="font-medium">
                          {budget.name}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(budget.amount, budget.currency)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(spent, budget.currency)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={usage} className="flex-1" />
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              {usage.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditBudget(budget)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBudget(budget)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      <CreateBudgetDialog
        open={isBudgetDialogOpen}
        onOpenChange={(open) => {
          setIsBudgetDialogOpen(open);
          if (!open) {
            setSelectedBudget(null);
          }
        }}
        tripId={tripId}
        budget={selectedBudget}
        onSuccess={() => {
          onBudgetsChange();
          setIsBudgetDialogOpen(false);
          setSelectedBudget(null);
        }}
      />
    </>
  );
}
