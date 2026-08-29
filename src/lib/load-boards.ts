import { Board } from '@/types/board';
import { boardsService } from '@/services/boardsService';
import { pickInitialBoard, syncTripsFromBoards } from '@/lib/board-trip-sync';
import { useAuthStore } from '@/store/authStore';
import { getBoardsCacheFromStorage, useBoardsStore } from '@/store/boardsStore';

function resolveCurrentBoard(
  boards: Board[],
  currentBoard: Board | null,
): Board | null {
  if (boards.length === 0) return null;

  const stillValid =
    currentBoard && boards.some((board) => board._id === currentBoard._id);
  const profileBoardId = useAuthStore.getState().user?.activeBoardId ?? null;
  const preferredId = stillValid
    ? currentBoard!._id
    : profileBoardId || pickInitialBoard(boards)?._id || null;

  return (
    (preferredId ? boards.find((board) => board._id === preferredId) : null) ??
    pickInitialBoard(boards)
  );
}

export async function loadBoards(): Promise<void> {
  const store = useBoardsStore.getState();
  const currentBoard = store.currentBoard;

  store.setBootstrapStatus('loading');
  store.setIsLoading(true);

  try {
    const { boards } = await boardsService.getAllBoards();
    store.setBoards(boards);
    const nextCurrent = resolveCurrentBoard(boards, currentBoard);
    store.setCurrentBoard(nextCurrent);
    syncTripsFromBoards(boards, nextCurrent);
    store.setBootstrapStatus('ready');
  } catch (error) {
    // `navigator.onLine` isn't a reliable signal for whether the request
    // actually failed due to connectivity, so fall back to the last known
    // boards whenever a cache exists, regardless of what it reports.
    const cachedBoards = getBoardsCacheFromStorage();
    if (cachedBoards && cachedBoards.length > 0) {
      store.setBoards(cachedBoards);
      const nextCurrent = resolveCurrentBoard(cachedBoards, currentBoard);
      store.setCurrentBoard(nextCurrent);
      syncTripsFromBoards(cachedBoards, nextCurrent);
      store.setBootstrapStatus('ready');
      return;
    }
    console.error(
      'Error al cargar tableros:',
      error instanceof Error ? error.message : String(error),
    );
    store.setBootstrapStatus('error');
  } finally {
    store.setIsLoading(false);
  }
}
