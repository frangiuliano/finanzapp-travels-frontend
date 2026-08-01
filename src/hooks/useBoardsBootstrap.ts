import { useEffect } from 'react';
import { loadBoards } from '@/lib/load-boards';

export function useBoardsBootstrap() {
  useEffect(() => {
    void loadBoards();
  }, []);
}

export { selectActiveBoard as selectBoard } from '@/lib/board-trip-sync';
