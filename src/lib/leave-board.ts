import { participantsService } from '@/services/participantsService';
import { removeBoardAndTrip } from '@/lib/board-trip-sync';
import { boardTypeLabel, type Board } from '@/types/board';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { requestConfirmation } from '@/lib/confirmation-events';

function getLeaveBoardConfirmMessage(board: Board): string {
  const typeLabel = boardTypeLabel(board.type).toLowerCase();

  return `¿Querés abandonar el tablero "${board.name}" (${typeLabel})? Dejarás de verlo en tu cuenta, pero el tablero sigue existiendo para el resto de los participantes.`;
}

export async function leaveBoardWithConfirm(board: Board): Promise<boolean> {
  if (
    !(await requestConfirmation({
      title: '¿Abandonar tablero?',
      description: getLeaveBoardConfirmMessage(board),
      confirmLabel: 'Abandonar tablero',
      action: 'leave',
    }))
  ) {
    return false;
  }

  try {
    await participantsService.leaveBoard(board._id);
    toast.success('Abandonaste el tablero');
    removeBoardAndTrip(board._id);
    return true;
  } catch (error) {
    console.error('Error al abandonar tablero:', error);
    const axiosError = error as AxiosError<{ message?: string }>;
    toast.error(
      axiosError.response?.data?.message || 'No se pudo abandonar el tablero',
    );
    return false;
  }
}
