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

interface InviteParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId?: string;
  tripName?: string;
  onSuccess?: () => void;
}

export function InviteParticipantDialog({
  open,
  onOpenChange,
  tripId,
  tripName,
  onSuccess,
}: InviteParticipantDialogProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTrip = useTripsStore((state) => state.currentTrip);
  const effectiveTripId = tripId || currentTrip?._id;
  const effectiveTripName = tripName || currentTrip?.name;

  const validateForm = () => {
    if (!email.trim()) {
      setError('El email es obligatorio');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Por favor, ingresa un email válido');
      return false;
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
      await participantsService.inviteParticipant(
        effectiveTripId,
        email.trim().toLowerCase(),
      );

      toast.success(`Invitación enviada a ${email}`);

      setEmail('');
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message || 'Error al enviar la invitación';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setEmail('');
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invitar Participante</DialogTitle>
          <DialogDescription>
            Envía una invitación por email para unirse al viaje
            {effectiveTripName && (
              <>
                {' '}
                <strong>"{effectiveTripName}"</strong>
              </>
            )}
            .
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email del participante *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@email.com"
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Se enviará un email con un enlace para unirse al viaje. La
              invitación expira en 7 días.
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
              {isLoading ? 'Enviando...' : 'Enviar Invitación'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
