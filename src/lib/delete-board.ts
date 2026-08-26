import { boardsService } from '@/services/boardsService';
import { removeBoardAndTrip } from '@/lib/board-trip-sync';
import { boardTypeLabel, type Board } from '@/types/board';
import { toast } from 'sonner';
import { useBoardsStore } from '@/store/boardsStore';

function getDeleteBoardConfirmMessage(board: Board): string {
  const typeLabel = boardTypeLabel(board.type).toLowerCase();

  if (board.type === 'travel') {
    return `¿Estás seguro de que deseas eliminar el viaje "${board.name}"? Se eliminarán definitivamente todos sus gastos, presupuestos, participantes, invitaciones y demás datos asociados. Esta acción no se puede deshacer.`;
  }

  const linkedTravelCount = useBoardsStore
    .getState()
    .boards.filter(
      (candidate) =>
        candidate.type === 'travel' &&
        (candidate.parentBoardId === board._id ||
          candidate.linkedEverydayBoardId === board._id),
    ).length;
  const travelNotice = linkedTravelCount
    ? ` Los ${linkedTravelCount} viaje${linkedTravelCount === 1 ? '' : 's'} vinculado${linkedTravelCount === 1 ? '' : 's'} no se eliminarán: quedarán independientes.`
    : '';

  return `¿Estás seguro de que deseas eliminar el tablero "${board.name}" (${typeLabel})? Se eliminarán definitivamente todos sus gastos, ingresos, recurrencias, cuotas, presupuestos, categorías y medios de pago propios.${travelNotice} Esta acción no se puede deshacer.`;
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
