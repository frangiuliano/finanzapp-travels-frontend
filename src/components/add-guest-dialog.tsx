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
import { participantsService } from '@/services/participantsService';
import { useTripsStore } from '@/store/tripsStore';
import { toast } from 'sonner';
import { AxiosError } from 'axios';

interface AddGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId?: string;
  tripName?: string;
  onSuccess?: () => void;
}

export function AddGuestDialog({
  open,
  onOpenChange,
  tripId,
  tripName,
  onSuccess,
}: AddGuestDialogProps) {
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTrip = useTripsStore((state) => state.currentTrip);
  const effectiveTripId = tripId || currentTrip?._id;
  const effectiveTripName = tripName || currentTrip?.name;

  const validateForm = () => {
    if (!guestName.trim()) {
      setError('El nombre es obligatorio');
      return false;
    }

    if (guestName.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return false;
    }

    if (guestEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(guestEmail.trim())) {
        setError('Por favor, ingresa un email válido');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    if (!effectiveTripId) {
      setError('No hay un viaje seleccionado');
      return;
    }

    setIsLoading(true);

    try {
      await participantsService.addGuestParticipant(
        effectiveTripId,
        guestName.trim(),
        guestEmail.trim() || undefined,
      );

      toast.success(`Invitado "${guestName}" añadido exitosamente`);

      setGuestName('');
      setGuestEmail('');
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message || 'Error al añadir el invitado';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setGuestName('');
      setGuestEmail('');
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir Invitado</DialogTitle>
          <DialogDescription>
            Añade un invitado al viaje
            {effectiveTripName && (
              <>
                {' '}
                <strong>"{effectiveTripName}"</strong>
              </>
            )}
            . Este invitado no recibirá un email automáticamente. Puedes
            enviarle una invitación más tarde desde la tabla de participantes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="guestName">Nombre del invitado *</Label>
            <Input
              id="guestName"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Juan Pérez"
              disabled={isLoading}
              autoFocus
              minLength={2}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestEmail">Email (opcional)</Label>
            <Input
              id="guestEmail"
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="juan@email.com"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Si proporcionas un email, podrás enviarle una invitación más tarde
              para que se una al tablero.
            </p>
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
            <Button type="submit" disabled={isLoading || !effectiveTripId}>
              {isLoading ? 'Añadiendo...' : 'Añadir Invitado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
