import { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import type { Participant } from '@/types/participant';

interface InviteGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participant: Participant | null;
  onSuccess?: () => void;
}

export function InviteGuestDialog({
  open,
  onOpenChange,
  participant,
  onSuccess,
}: InviteGuestDialogProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (participant && open) {
      setEmail(participant.guestEmail || '');
      setError(null);
    }
  }, [participant, open]);

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

    if (!participant) {
      setError('No hay participante seleccionado');
      return;
    }

    setIsLoading(true);

    try {
      await participantsService.inviteGuest(
        participant._id,
        email.trim().toLowerCase(),
      );

      toast.success(`Invitación enviada a ${email.trim()}`);

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

  if (!participant) {
    return null;
  }

  const isGuest = !participant.userId && participant.guestName;
  const hasPendingInvitation = Boolean(
    participant.invitationId &&
    (typeof participant.invitationId === 'object'
      ? participant.invitationId.status === 'pending'
      : true),
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Invitación a Invitado</DialogTitle>
          <DialogDescription>
            Envía una invitación por email a{' '}
            <strong>{participant.guestName}</strong> para que se una al tablero.
            Se enviará un email con un enlace para unirse al viaje.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {hasPendingInvitation && (
            <div className="rounded-md bg-blue-500/15 p-3 text-sm text-blue-700 dark:text-blue-400">
              Este invitado ya tiene una invitación pendiente.
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {!isGuest && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              Este participante ya tiene cuenta. No es necesario enviar
              invitación.
            </div>
          )}

          {isGuest && (
            <div className="space-y-2">
              <Label htmlFor="email">Email del invitado *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@email.com"
                disabled={isLoading || hasPendingInvitation}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Se enviará un email con un enlace para unirse al viaje. La
                invitación expira en 7 días.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isGuest || hasPendingInvitation}
            >
              {isLoading ? 'Enviando...' : 'Enviar Invitación'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
