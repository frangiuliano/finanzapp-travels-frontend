import { useEffect } from 'react';
import { boardsService } from '@/services/boardsService';
import {
  getLastActiveBoardIdFromStorage,
  useBoardsStore,
} from '@/store/boardsStore';
import { useTripsStore } from '@/store/tripsStore';
import { Trip } from '@/services/tripsService';
import { Board } from '@/types/board';

function boardToTrip(board: Board): Trip {
  return {
    _id: board._id,
    name: board.name,
    baseCurrency: board.baseCurrency,
    createdAt: board.createdAt,
    userRole: board.userRole,
    createdBy: board.createdBy,
  };
}

function syncTripsStore(boards: Board[], currentBoard: Board | null) {
  const setTrips = useTripsStore.getState().setTrips;
  const setCurrentTrip = useTripsStore.getState().setCurrentTrip;
  setTrips(boards.map(boardToTrip));
  setCurrentTrip(currentBoard ? boardToTrip(currentBoard) : null);
}

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

        let nextCurrent: Board | null = null;
        if (boards.length > 0) {
          const lastId = getLastActiveBoardIdFromStorage();
          const lastBoard = lastId
            ? boards.find((board) => board._id === lastId)
            : null;
          const stillValid =
            currentBoard &&
            boards.some((board) => board._id === currentBoard._id);
          nextCurrent = stillValid
            ? (boards.find((board) => board._id === currentBoard._id) ?? null)
            : lastBoard || boards[0];
          setCurrentBoard(nextCurrent);
        } else {
          setCurrentBoard(null);
        }

        syncTripsStore(boards, nextCurrent);
      } catch (error) {
        console.error('Error al cargar tableros:', error);
        if (!cancelled) {
          setBoards([]);
          setCurrentBoard(null);
          syncTripsStore([], null);
        }
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

export function selectBoard(board: Board | null) {
  useBoardsStore.getState().setCurrentBoard(board);
  useTripsStore.getState().setCurrentTrip(board ? boardToTrip(board) : null);
}
