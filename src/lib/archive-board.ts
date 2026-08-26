import { toast } from 'sonner';
import { boardsService } from '@/services/boardsService';
import { addBoardToStores, removeBoardAndTrip } from '@/lib/board-trip-sync';
import type { Board } from '@/types/board';

export const BOARDS_ARCHIVE_CHANGED_EVENT = 'finanzapp:boards-archive-changed';

export async function archiveBoardWithConfirm(board: Board): Promise<boolean> {
  if (board.type === 'everyday') {
    toast.error('El tablero principal no se puede archivar');
    return false;
  }
  if (
    !confirm(`¿Archivar “${board.name}”? Sus gastos y datos se conservarán.`)
  ) {
    return false;
  }
  try {
    await boardsService.archiveBoard(board._id);
    removeBoardAndTrip(board._id);
    window.dispatchEvent(new Event(BOARDS_ARCHIVE_CHANGED_EVENT));
    toast.success('Tablero archivado');
    return true;
  } catch {
    toast.error('No se pudo archivar el tablero');
    return false;
  }
}

export async function unarchiveBoard(board: Board): Promise<boolean> {
  try {
    const { board: restored } = await boardsService.unarchiveBoard(board._id);
    addBoardToStores(restored);
    window.dispatchEvent(new Event(BOARDS_ARCHIVE_CHANGED_EVENT));
    toast.success('Tablero desarchivado');
    return true;
  } catch {
    toast.error('No se pudo desarchivar el tablero');
    return false;
  }
}
