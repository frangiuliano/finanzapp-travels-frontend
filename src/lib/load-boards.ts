import { boardsService } from '@/services/boardsService';
import { pickInitialBoard, syncTripsFromBoards } from '@/lib/board-trip-sync';
import { useAuthStore } from '@/store/authStore';
import { useBoardsStore } from '@/store/boardsStore';

export async function loadBoards(): Promise<void> {
  const store = useBoardsStore.getState();
  const currentBoard = store.currentBoard;

  store.setBootstrapStatus('loading');
  store.setIsLoading(true);

  try {
    const { boards } = await boardsService.getAllBoards();

    store.setBoards(boards);

    let nextCurrent = null;
    if (boards.length > 0) {
      const stillValid =
        currentBoard && boards.some((board) => board._id === currentBoard._id);
      const profileBoardId =
        useAuthStore.getState().user?.activeBoardId ?? null;
      const preferredId = stillValid
        ? currentBoard!._id
        : profileBoardId || pickInitialBoard(boards)?._id || null;
      nextCurrent = preferredId
        ? (boards.find((board) => board._id === preferredId) ?? null)
        : null;
      if (!nextCurrent) {
        nextCurrent = pickInitialBoard(boards);
      }
      store.setCurrentBoard(nextCurrent);
    } else {
      store.setCurrentBoard(null);
      nextCurrent = null;
    }

    syncTripsFromBoards(boards, nextCurrent);
    store.setBootstrapStatus('ready');
  } catch (error) {
    console.error('Error al cargar tableros:', error);
    store.setBootstrapStatus('error');
  } finally {
    store.setIsLoading(false);
  }
}
