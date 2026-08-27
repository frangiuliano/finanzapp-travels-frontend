import { useCallback, useEffect, useState } from 'react';
import { Mail, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InviteParticipantDialog } from '@/components/invite-participant-dialog';
import { participantsService } from '@/services/participantsService';
import { ParticipantRole } from '@/services/tripsService';
import type { Board } from '@/types/board';
import type { Participant } from '@/types/participant';

interface ManageBoardParticipantsSectionProps {
  board: Board;
}

function participantDetails(participant: Participant) {
  if (!participant.userId) {
    return {
      name: participant.guestName || 'Invitado',
      email: participant.guestEmail || 'Sin email',
    };
  }

  if (typeof participant.userId === 'string') {
    return { name: 'Usuario', email: '' };
  }

  return {
    name:
      `${participant.userId.firstName} ${participant.userId.lastName}`.trim() ||
      'Usuario',
    email: participant.userId.email,
  };
}

export function ManageBoardParticipantsSection({
  board,
}: ManageBoardParticipantsSectionProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const isOwner = board.userRole === ParticipantRole.OWNER;

  const loadParticipants = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await participantsService.getParticipants(board._id);
      setParticipants(result.participants);
    } catch {
      toast.error('No se pudieron cargar los participantes');
    } finally {
      setIsLoading(false);
    }
  }, [board._id]);

  useEffect(() => {
    void loadParticipants();
  }, [loadParticipants]);

  const removeParticipant = async (participant: Participant) => {
    if (!confirm('¿Eliminar a esta persona del tablero?')) return;

    setRemovingId(participant._id);
    try {
      await participantsService.removeParticipant(board._id, participant._id);
      toast.success('Participante eliminado');
      await loadParticipants();
    } catch {
      toast.error('No se pudo eliminar al participante');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {isLoading
              ? 'Cargando participantes…'
              : `${participants.length} ${participants.length === 1 ? 'participante' : 'participantes'}`}
          </div>
          {isOwner ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setIsInviteOpen(true)}
            >
              <Mail className="mr-2 h-4 w-4" />
              Invitar por email
            </Button>
          ) : null}
        </div>

        {!isLoading && participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay participantes en este tablero.
          </p>
        ) : (
          <div className="divide-y rounded-xl border">
            {participants.map((participant) => {
              const details = participantDetails(participant);
              const participantIsOwner =
                participant.role === ParticipantRole.OWNER;
              return (
                <div
                  key={participant._id}
                  className="flex items-center gap-3 px-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {details.name}
                      </p>
                      <Badge
                        variant={participantIsOwner ? 'default' : 'secondary'}
                      >
                        {participantIsOwner ? 'Propietario' : 'Miembro'}
                      </Badge>
                    </div>
                    {details.email ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {details.email}
                      </p>
                    ) : null}
                  </div>
                  {isOwner && !participantIsOwner ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Eliminar a ${details.name}`}
                      disabled={removingId === participant._id}
                      onClick={() => void removeParticipant(participant)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <InviteParticipantDialog
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        tripId={board._id}
        tripName={board.name}
        boardType={board.type}
        onSuccess={() => void loadParticipants()}
      />
    </>
  );
}
