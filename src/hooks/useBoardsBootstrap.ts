import { useEffect } from 'react';
import { boardsService } from '@/services/boardsService';
import {
  pickInitialBoard,
  selectActiveBoard,
  syncTripsFromBoards,
} from '@/lib/board-trip-sync';
import { useBoardsStore } from '@/store/boardsStore';

export function useBoardsBootstrap() {
  const setBoards = useBoardsStore((state) => state.setBoards);
  const setCurrentBoard = useBoardsStore((state) => state.setCurrentBoard);
  const setIsLoading = useBoardsStore((state) => state.setIsLoading);
  const currentBoard = useBoardsStore((state) => state.currentBoard);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const { boards } = await boardsService.getAllBoards();
        if (cancelled) return;

        setBoards(boards);

        let nextCurrent = null;
        if (boards.length > 0) {
          const stillValid =
            currentBoard &&
            boards.some((board) => board._id === currentBoard._id);
          nextCurrent = stillValid
            ? (boards.find((board) => board._id === currentBoard!._id) ?? null)
            : pickInitialBoard(boards);
          setCurrentBoard(nextCurrent);
        } else {
          setCurrentBoard(null);
          nextCurrent = null;
        }

        syncTripsFromBoards(boards, nextCurrent);
      } catch (error) {
        console.error('Error al cargar tableros:', error);
        // Keep existing trips/boards stores; only clear loading flag.
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
    // Bootstrap once per authenticated shell mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only load
  }, [setBoards, setCurrentBoard, setIsLoading]);
}

export { selectActiveBoard as selectBoard };
