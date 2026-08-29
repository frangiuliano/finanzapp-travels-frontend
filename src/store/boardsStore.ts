import { create } from 'zustand';
import { Board } from '@/types/board';

const LAST_ACTIVE_BOARD_KEY = 'lastActiveBoardId';
const BOARDS_CACHE_KEY = 'finanzapp-boards-cache';

export type BootstrapStatus = 'pending' | 'loading' | 'ready' | 'error';

interface BoardsState {
  boards: Board[];
  currentBoard: Board | null;
  isLoading: boolean;
  bootstrapStatus: BootstrapStatus;
  setBoards: (boards: Board[]) => void;
  addBoard: (board: Board) => void;
  updateBoard: (board: Board) => void;
  removeBoard: (boardId: string) => void;
  setCurrentBoard: (board: Board | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setBootstrapStatus: (status: BootstrapStatus) => void;
}

const saveLastActiveBoardId = (boardId: string | null) => {
  if (typeof window === 'undefined') return;
  if (boardId) {
    localStorage.setItem(LAST_ACTIVE_BOARD_KEY, boardId);
  } else {
    localStorage.removeItem(LAST_ACTIVE_BOARD_KEY);
  }
};

export const getLastActiveBoardIdFromStorage = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_ACTIVE_BOARD_KEY);
};

/**
 * Boards are lightweight metadata (name, currency, type) — no financial
 * transaction data — so caching the last known list lets a cold, offline
 * app load fall back to it instead of hard-blocking on the network fetch.
 */
const saveBoardsCache = (boards: Board[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BOARDS_CACHE_KEY, JSON.stringify(boards));
  } catch {
    // localStorage unavailable (private mode, quota) — this cache is a
    // convenience for offline continuity, not a requirement.
  }
};

export const getBoardsCacheFromStorage = (): Board[] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BOARDS_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Board[]) : null;
  } catch {
    return null;
  }
};

export const useBoardsStore = create<BoardsState>((set) => ({
  boards: [],
  currentBoard: null,
  isLoading: true,
  bootstrapStatus: 'pending',
  setBoards: (boards) => {
    saveBoardsCache(boards);
    set({ boards });
  },
  addBoard: (board) =>
    set((state) => {
      const boards = [board, ...state.boards];
      saveBoardsCache(boards);
      return { boards };
    }),
  updateBoard: (updatedBoard) =>
    set((state) => {
      const boards = state.boards.map((board) =>
        board._id === updatedBoard._id ? updatedBoard : board,
      );
      const currentBoard =
        state.currentBoard?._id === updatedBoard._id
          ? updatedBoard
          : state.currentBoard;
      saveBoardsCache(boards);
      return { boards, currentBoard };
    }),
  removeBoard: (boardId) =>
    set((state) => {
      const boards = state.boards.filter((board) => board._id !== boardId);
      const currentBoard =
        state.currentBoard?._id === boardId ? null : state.currentBoard;
      if (!currentBoard) {
        saveLastActiveBoardId(null);
      }
      saveBoardsCache(boards);
      return { boards, currentBoard };
    }),
  setCurrentBoard: (board) => {
    saveLastActiveBoardId(board?._id || null);
    set({ currentBoard: board });
  },
  setIsLoading: (isLoading) => set({ isLoading }),
  setBootstrapStatus: (bootstrapStatus) => set({ bootstrapStatus }),
}));
