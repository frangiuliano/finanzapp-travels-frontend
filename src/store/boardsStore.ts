import { create } from 'zustand';
import { Board } from '@/types/board';

const LAST_ACTIVE_BOARD_KEY = 'lastActiveBoardId';

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

export const useBoardsStore = create<BoardsState>((set) => ({
  boards: [],
  currentBoard: null,
  isLoading: true,
  bootstrapStatus: 'pending',
  setBoards: (boards) => set({ boards }),
  addBoard: (board) =>
    set((state) => ({
      boards: [board, ...state.boards],
    })),
  updateBoard: (updatedBoard) =>
    set((state) => {
      const boards = state.boards.map((board) =>
        board._id === updatedBoard._id ? updatedBoard : board,
      );
      const currentBoard =
        state.currentBoard?._id === updatedBoard._id
          ? updatedBoard
          : state.currentBoard;
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
      return { boards, currentBoard };
    }),
  setCurrentBoard: (board) => {
    saveLastActiveBoardId(board?._id || null);
    set({ currentBoard: board });
  },
  setIsLoading: (isLoading) => set({ isLoading }),
  setBootstrapStatus: (bootstrapStatus) => set({ bootstrapStatus }),
}));
