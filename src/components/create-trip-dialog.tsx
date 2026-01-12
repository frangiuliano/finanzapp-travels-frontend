import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { tripsService } from '@/services/tripsService';
import { useTripsStore } from '@/store/tripsStore';
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
  onSuccess?: () => void;
}

export function CreateTripDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateTripDialogProps) {
  const [name, setName] = useState('');
  const [baseCurrency, setBaseCurrency] = useState(DEFAULT_CURRENCY);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  const addTrip = useTripsStore((state) => state.addTrip);
  const setCurrentTrip = useTripsStore((state) => state.setCurrentTrip);
  const currentTrip = useTripsStore((state) => state.currentTrip);

  const validateForm = () => {
    const newErrors: { name?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre del viaje es obligatorio';
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
      const result = await tripsService.createTrip({
        name: name.trim(),
        baseCurrency,
      });

      toast.success(result.message || 'Viaje creado exitosamente');

      addTrip(result.trip);

      if (!currentTrip) {
        setCurrentTrip(result.trip);
      }

      setName('');
      setBaseCurrency(DEFAULT_CURRENCY);
      setErrors({});

      onSuccess?.();
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
      setErrors({});
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nuevo Viaje</DialogTitle>
          <DialogDescription>
            Completa la información para crear un nuevo viaje.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Viaje *</Label>
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
            <Label htmlFor="baseCurrency">Moneda Base</Label>
            <Select
              value={baseCurrency}
              onValueChange={(value) => {
                if (SUPPORTED_CURRENCIES.includes(value as SupportedCurrency)) {
                  setBaseCurrency(value as SupportedCurrency);
                }
              }}
              disabled={isLoading}
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
              {isLoading ? 'Creando...' : 'Crear Viaje'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
