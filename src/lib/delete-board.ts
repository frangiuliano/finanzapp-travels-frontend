import { boardsService } from '@/services/boardsService';
import { removeBoardAndTrip } from '@/lib/board-trip-sync';
import { boardTypeLabel, type Board } from '@/types/board';
import { toast } from 'sonner';

function getDeleteBoardConfirmMessage(board: Board): string {
  const typeLabel = boardTypeLabel(board.type).toLowerCase();

  if (board.type === 'travel') {
    return `¿Estás seguro de que deseas eliminar el viaje "${board.name}"? Esta acción eliminará todos los presupuestos, participantes e invitaciones asociadas y no se puede deshacer.`;
  }

  return `¿Estás seguro de que deseas eliminar el tablero "${board.name}" (${typeLabel})? Se eliminarán todos los gastos, categorías y medios de pago asociados. Esta acción no se puede deshacer.`;
}

export async function deleteBoardWithConfirm(board: Board): Promise<boolean> {
  if (!confirm(getDeleteBoardConfirmMessage(board))) {
    return false;
  }

  try {
    await boardsService.deleteBoard(board._id);
    toast.success('Tablero eliminado exitosamente');
    removeBoardAndTrip(board._id);
    return true;
  } catch (error) {
    console.error('Error al eliminar tablero:', error);
    toast.error('Error al eliminar el tablero');
    return false;
  }
}
