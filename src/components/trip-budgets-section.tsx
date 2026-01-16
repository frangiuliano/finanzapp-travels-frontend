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
    return new Intl.NumberFormat('es-ES', {
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
      !confirm(
        `¿Estás seguro de que deseas eliminar el presupuesto "${budget.name}"?`,
      )
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
            <Table>
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
