import { Board, BoardType } from '@/types/board';
import { syncTelegramActiveBoard } from '@/lib/sync-active-board';
import {
  getLastActiveBoardIdFromStorage,
  useBoardsStore,
} from '@/store/boardsStore';
import {
  getLastInteractedTripIdFromStorage,
  useTripsStore,
} from '@/store/tripsStore';
import { Trip } from '@/services/tripsService';

export function boardToTrip(board: Board): Trip {
  return {
    _id: board._id,
    name: board.name,
    baseCurrency: board.baseCurrency,
    createdAt: board.createdAt,
    userRole: board.userRole,
    createdBy: board.createdBy,
  };
}

export function tripToBoard(
  trip: Trip,
  previous?: Pick<Board, 'type' | 'isShared'> | null,
): Board {
  return {
    _id: trip._id,
    name: trip.name,
    baseCurrency: trip.baseCurrency,
    createdAt: trip.createdAt,
    userRole: trip.userRole,
    createdBy: trip.createdBy,
    type: previous?.type ?? 'travel',
    isShared: previous?.isShared ?? false,
  };
}

function resolvePreferredBoard(
  boards: Board[],
  preferredId: string | null,
): Board | null {
  if (boards.length === 0) return null;
  if (preferredId) {
    const match = boards.find((board) => board._id === preferredId);
    if (match) return match;
  }
  return boards[0];
}

/** Preferred board id: new key first, then legacy trip key. */
export function getPreferredBoardIdFromStorage(): string | null {
  return (
    getLastActiveBoardIdFromStorage() || getLastInteractedTripIdFromStorage()
  );
}

export function syncTripsFromBoards(
  boards: Board[],
  currentBoard: Board | null,
) {
  useTripsStore.getState().setTrips(boards.map(boardToTrip));
  useTripsStore
    .getState()
    .setCurrentTrip(currentBoard ? boardToTrip(currentBoard) : null);
}

export function syncBoardsFromTrips(
  trips: Trip[],
  currentTrip: Trip | null = useTripsStore.getState().currentTrip,
) {
  const existingById = new Map(
    useBoardsStore.getState().boards.map((board) => [board._id, board]),
  );
  const boards = trips.map((trip) =>
    tripToBoard(trip, existingById.get(trip._id) ?? null),
  );

  let nextCurrent: Board | null = null;
  if (currentTrip) {
    nextCurrent = boards.find((board) => board._id === currentTrip._id) ?? null;
  }
  if (!nextCurrent) {
    nextCurrent = resolvePreferredBoard(
      boards,
      getPreferredBoardIdFromStorage(),
    );
  }

  useBoardsStore.getState().setBoards(boards);
  useBoardsStore.getState().setCurrentBoard(nextCurrent);
  useTripsStore.getState().setTrips(trips);
  useTripsStore
    .getState()
    .setCurrentTrip(nextCurrent ? boardToTrip(nextCurrent) : null);
}

export function addBoardFromTrip(
  trip: Trip,
  meta?: { type?: BoardType; isShared?: boolean },
) {
  const board = tripToBoard(trip, {
    type: meta?.type ?? 'travel',
    isShared: meta?.isShared ?? false,
  });
  addBoardToStores(board);

  const currentBoard = useBoardsStore.getState().currentBoard;
  if (!currentBoard) {
    selectActiveBoard(board);
  }
}

export function addBoardToStores(board: Board) {
  useBoardsStore.getState().addBoard(board);
  useTripsStore.getState().addTrip(boardToTrip(board));
}

export function updateBoardFromTrip(trip: Trip) {
  const previous = useBoardsStore
    .getState()
    .boards.find((board) => board._id === trip._id);
  const board = tripToBoard(trip, previous ?? null);
  useBoardsStore.getState().updateBoard(board);
  useTripsStore.getState().updateTrip(trip);
}

export function removeBoardAndTrip(boardId: string) {
  useBoardsStore.getState().removeBoard(boardId);
  useTripsStore.getState().removeTrip(boardId);

  const { boards, currentBoard } = useBoardsStore.getState();
  if (!currentBoard) {
    const next = boards[0] ?? null;
    selectActiveBoard(next);
  }
}

export function selectActiveBoard(board: Board | null) {
  const previousBoard = useBoardsStore.getState().currentBoard;
  const previousTrip = useTripsStore.getState().currentTrip;

  useBoardsStore.getState().setCurrentBoard(board);
  useTripsStore.getState().setCurrentTrip(board ? boardToTrip(board) : null);

  if (board) {
    void syncTelegramActiveBoard(board._id).catch((error) => {
      useBoardsStore.getState().setCurrentBoard(previousBoard);
      useTripsStore.getState().setCurrentTrip(previousTrip);
      console.error(
        'Error al sincronizar tablero activo para Telegram:',
        error,
      );
    });
  }
}

export function pickInitialBoard(boards: Board[]): Board | null {
  return resolvePreferredBoard(boards, getPreferredBoardIdFromStorage());
}
