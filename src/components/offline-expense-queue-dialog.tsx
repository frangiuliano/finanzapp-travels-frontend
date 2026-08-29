import { useCallback, useEffect, useState } from 'react';
import { Download, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  offlineExpenseQueue,
  subscribeOfflineQueue,
  type QueuedExpenseEntry,
} from '@/services/offlineExpenseQueue';
import { retryOfflineExpense } from '@/services/createExpenseWithOffline';
import { useAuthStore } from '@/store/authStore';

interface OfflineExpenseQueueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetryAll: () => Promise<void>;
}

interface EditDraft {
  clientRequestId: string;
  amount: string;
  description: string;
  merchantName: string;
  expenseDate: string;
}

function formatQueuedAt(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'No se pudo completar la acción';
}

export function OfflineExpenseQueueDialog({
  open,
  onOpenChange,
  onRetryAll,
}: OfflineExpenseQueueDialogProps) {
  const userId = useAuthStore((state) => state.user?.id);
  const [entries, setEntries] = useState<QueuedExpenseEntry[]>([]);
  const [editing, setEditing] = useState<EditDraft | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    if (!userId) {
      setEntries([]);
      return;
    }
    const queued = await offlineExpenseQueue.getAllForUser(userId);
    setEntries(
      [...queued].sort((a, b) => a.enqueuedAt.localeCompare(b.enqueuedAt)),
    );
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeOfflineQueue(userId, () => {
      void loadEntries();
    });
    if (open) void loadEntries();
    return unsubscribe;
  }, [loadEntries, open, userId]);

  const retryOne = async (entry: QueuedExpenseEntry) => {
    setBusyId(entry.clientRequestId);
    try {
      await retryOfflineExpense(entry.clientRequestId);
      toast.success('Gasto sincronizado');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyId(null);
      await loadEntries();
    }
  };

  const retryAll = async () => {
    setBusyId('all');
    try {
      await onRetryAll();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyId(null);
      await loadEntries();
    }
  };

  const discard = async (entry: QueuedExpenseEntry) => {
    if (
      !confirm(`¿Descartar el gasto pendiente “${entry.payload.description}”?`)
    ) {
      return;
    }
    await offlineExpenseQueue.remove(entry.clientRequestId);
    toast.success('Gasto pendiente descartado');
    await loadEntries();
  };

  const beginEdit = (entry: QueuedExpenseEntry) => {
    setEditing({
      clientRequestId: entry.clientRequestId,
      amount: String(entry.payload.amount),
      description: entry.payload.description,
      merchantName: entry.payload.merchantName ?? '',
      expenseDate: entry.payload.expenseDate?.slice(0, 10) ?? '',
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const entry = entries.find(
      (item) => item.clientRequestId === editing.clientRequestId,
    );
    if (!entry) return;
    const amount = Number(editing.amount);
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !editing.description.trim()
    ) {
      toast.error('Ingresá un monto válido y una descripción');
      return;
    }
    await offlineExpenseQueue.updatePayload(entry.clientRequestId, {
      ...entry.payload,
      amount: entry.payload.splits?.length ? entry.payload.amount : amount,
      description: editing.description.trim(),
      merchantName: editing.merchantName.trim() || undefined,
      expenseDate: editing.expenseDate
        ? new Date(`${editing.expenseDate}T12:00:00`).toISOString()
        : undefined,
    });
    setEditing(null);
    toast.success('Gasto pendiente actualizado');
    await loadEntries();
  };

  const exportQueue = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `finanzapp-gastos-pendientes-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gastos pendientes de sincronizar</DialogTitle>
          <DialogDescription>
            Se conservan en este dispositivo hasta que los sincronices o los
            descartes explícitamente.
          </DialogDescription>
        </DialogHeader>

        {entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No hay gastos pendientes.
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.clientRequestId}
                className="rounded-lg border p-3"
              >
                {editing?.clientRequestId === entry.clientRequestId ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label
                        htmlFor={`offline-description-${entry.clientRequestId}`}
                      >
                        Descripción
                      </Label>
                      <Input
                        id={`offline-description-${entry.clientRequestId}`}
                        value={editing.description}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            description: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor={`offline-amount-${entry.clientRequestId}`}
                      >
                        Monto
                      </Label>
                      <Input
                        id={`offline-amount-${entry.clientRequestId}`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        disabled={Boolean(entry.payload.splits?.length)}
                        value={editing.amount}
                        onChange={(event) =>
                          setEditing({ ...editing, amount: event.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor={`offline-merchant-${entry.clientRequestId}`}
                      >
                        Comercio
                      </Label>
                      <Input
                        id={`offline-merchant-${entry.clientRequestId}`}
                        value={editing.merchantName}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            merchantName: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`offline-date-${entry.clientRequestId}`}>
                        Fecha
                      </Label>
                      <Input
                        id={`offline-date-${entry.clientRequestId}`}
                        type="date"
                        value={editing.expenseDate}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            expenseDate: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex gap-2 sm:col-span-2">
                      <Button type="button" size="sm" onClick={saveEdit}>
                        Guardar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {entry.payload.description}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entry.payload.amount} {entry.payload.currency ?? ''}{' '}
                          · {formatQueuedAt(entry.enqueuedAt)}
                        </p>
                        {entry.lastError && (
                          <p className="mt-1 text-sm text-destructive">
                            Último intento: {entry.lastError}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={busyId !== null || !navigator.onLine}
                        onClick={() => void retryOne(entry)}
                      >
                        <RefreshCw className="mr-1 size-4" /> Reintentar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => beginEdit(entry)}
                      >
                        <Pencil className="mr-1 size-4" /> Editar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => void discard(entry)}
                      >
                        <Trash2 className="mr-1 size-4" /> Descartar
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            disabled={entries.length === 0}
            onClick={exportQueue}
          >
            <Download className="mr-1 size-4" /> Exportar JSON
          </Button>
          <Button
            type="button"
            disabled={
              entries.length === 0 || busyId !== null || !navigator.onLine
            }
            onClick={() => void retryAll()}
          >
            <RefreshCw className="mr-1 size-4" /> Reintentar todos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
