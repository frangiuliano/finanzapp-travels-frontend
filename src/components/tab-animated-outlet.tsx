import { useCallback, useRef } from 'react';
import { useOutlet } from 'react-router-dom';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';
import { PullToRefreshIndicator } from '@/components/pull-to-refresh-indicator';
import {
  PULL_REFRESH_THRESHOLD,
  usePullToRefresh,
} from '@/hooks/usePullToRefresh';
import { loadBoards } from '@/lib/load-boards';
import { notifyExpensesChanged } from '@/lib/expense-events';

/**
 * Mobile uses the standard router outlet so only one page mounts at a time.
 * Preserving multiple tab panels caused invisible layers that blocked taps on iOS PWA.
 */
export function TabAnimatedOutlet() {
  const outlet = useOutlet();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRefresh = useCallback(async () => {
    await loadBoards();
    notifyExpensesChanged();
  }, []);

  const { pullDistance, isRefreshing, isReady, isDragging } = usePullToRefresh(
    containerRef,
    handleRefresh,
  );

  return (
    <div
      ref={containerRef}
      className="tab-content-stack relative z-0 flex min-h-0 flex-1 flex-col max-md:overflow-y-auto max-md:overscroll-y-contain max-md:pb-[var(--mobile-nav-total)]"
    >
      <div
        aria-hidden
        className="flex shrink-0 items-center justify-center overflow-hidden"
        style={{
          height: isRefreshing ? PULL_REFRESH_THRESHOLD : pullDistance,
          transition: isDragging ? 'none' : 'height 200ms ease-out',
        }}
      >
        <PullToRefreshIndicator
          progress={pullDistance / PULL_REFRESH_THRESHOLD}
          isRefreshing={isRefreshing}
          isReady={isReady}
          isDragging={isDragging}
        />
      </div>
      <PWAInstallPrompt />
      {outlet}
    </div>
  );
}
