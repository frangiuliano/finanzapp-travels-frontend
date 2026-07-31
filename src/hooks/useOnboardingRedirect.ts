import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBoardsStore } from '@/store/boardsStore';
import { isBoardMocksEnabled } from '@/services/boardsService';

/**
 * Sends users without boards to /onboarding after bootstrap.
 * Skipped when board mocks are enabled (shell dev mode).
 */
export function useOnboardingRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const boards = useBoardsStore((state) => state.boards);
  const isLoading = useBoardsStore((state) => state.isLoading);

  useEffect(() => {
    if (isBoardMocksEnabled()) return;
    if (isLoading) return;
    if (boards.length > 0) return;
    if (location.pathname === '/onboarding') return;

    navigate('/onboarding', { replace: true });
  }, [boards.length, isLoading, location.pathname, navigate]);
}
