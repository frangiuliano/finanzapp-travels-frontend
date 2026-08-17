import { useEffect, useState } from 'react';
import { ResponsiveFormDialog } from '@/components/responsive-form-dialog';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { boardsService } from '@/services/boardsService';
import { addBoardToStores, selectActiveBoard } from '@/lib/board-trip-sync';
import type { Board } from '@/types/board';
import { useBoardsStore } from '@/store/boardsStore';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import {
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  SupportedCurrency,
} from '@/constants/currencies';

interface CreateTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (board: Board) => void;
}

export function CreateTripDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateTripDialogProps) {
  const [name, setName] = useState('');
  const [baseCurrency, setBaseCurrency] = useState(DEFAULT_CURRENCY);
  const [isLoading, setIsLoading] = useState(false);
  const boards = useBoardsStore((state) => state.boards);
  const everydayBoards = boards.filter((board) => board.type === 'everyday');
  const [parentBoardId, setParentBoardId] = useState(
    () => everydayBoards[0]?._id ?? '',
  );
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (open && !parentBoardId && everydayBoards[0]) {
      setParentBoardId(everydayBoards[0]._id);
      setBaseCurrency(everydayBoards[0].baseCurrency as SupportedCurrency);
    }
  }, [open, parentBoardId, everydayBoards]);

  const validateForm = () => {
    const newErrors: { name?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre del tablero de viaje es obligatorio';
    } else if (name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (name.trim().length > 100) {
      newErrors.name = 'El nombre no puede tener más de 100 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await boardsService.createBoard({
        name: name.trim(),
        baseCurrency,
        type: 'travel',
        parentBoardId: parentBoardId || undefined,
      });

      toast.success(result.message || 'Viaje creado exitosamente');

      addBoardToStores(result.board);
      selectActiveBoard(result.board);

      setName('');
      setBaseCurrency(DEFAULT_CURRENCY);
      setParentBoardId(everydayBoards[0]?._id ?? '');
      setErrors({});

      onSuccess?.(result.board);
      onOpenChange(false);
    } catch (error) {
      const axiosError = error as AxiosError<{
        message?: string;
        errors?: { name?: string };
      }>;
      const errorMessage =
        axiosError.response?.data?.message || 'Error al crear el viaje';
      toast.error(errorMessage);

      if (axiosError.response?.data?.errors) {
        setErrors(axiosError.response.data.errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName('');
      setBaseCurrency(DEFAULT_CURRENCY);
      setParentBoardId(everydayBoards[0]?._id ?? '');
      setErrors({});
    }
    onOpenChange(newOpen);
  };

  return (
    <ResponsiveFormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Nuevo tablero de viaje"
      description="Creá un tablero para dividir gastos con otros durante un viaje."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del viaje *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Vacaciones en Europa"
            disabled={isLoading}
            autoFocus
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="parentBoard">Tablero principal</Label>
          <Select
            value={parentBoardId}
            onValueChange={(value) => {
              setParentBoardId(value);
              const parent = everydayBoards.find(
                (board) => board._id === value,
              );
              if (
                parent &&
                SUPPORTED_CURRENCIES.includes(
                  parent.baseCurrency as SupportedCurrency,
                )
              ) {
                setBaseCurrency(parent.baseCurrency as SupportedCurrency);
              }
            }}
            disabled={isLoading || everydayBoards.length === 0}
          >
            <SelectTrigger id="parentBoard">
              <SelectValue placeholder="Sin tablero cotidiano" />
            </SelectTrigger>
            <SelectContent>
              {everydayBoards.map((board) => (
                <SelectItem key={board._id} value={board._id}>
                  {board.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {parentBoardId ? (
            <p className="text-xs text-muted-foreground">
              Usa la moneda del tablero principal para consolidar importes.
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Los gastos del viaje también aparecerán en este tablero.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="baseCurrency">Moneda Base</Label>
          <Select
            value={baseCurrency}
            onValueChange={(value) => {
              if (SUPPORTED_CURRENCIES.includes(value as SupportedCurrency)) {
                setBaseCurrency(value as SupportedCurrency);
              }
            }}
            disabled={isLoading || Boolean(parentBoardId)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creando…' : 'Crear viaje'}
          </Button>
        </DialogFooter>
      </form>
    </ResponsiveFormDialog>
  );
}
