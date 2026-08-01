import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBoardsStore } from '@/store/boardsStore';
import { isBoardMocksEnabled } from '@/services/boardsService';

/**
 * Sends users without boards to /onboarding after bootstrap completes.
 * Skipped when board mocks are enabled (shell dev mode).
 */
export function useOnboardingRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const boards = useBoardsStore((state) => state.boards);
  const bootstrapStatus = useBoardsStore((state) => state.bootstrapStatus);

  useEffect(() => {
    if (isBoardMocksEnabled()) return;
    if (bootstrapStatus !== 'ready') return;
    if (boards.length > 0) return;
    if (location.pathname === '/onboarding') return;

    navigate('/onboarding', { replace: true });
  }, [boards.length, bootstrapStatus, location.pathname, navigate]);
}
