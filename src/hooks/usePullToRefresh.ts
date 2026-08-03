import { useEffect, useRef, useState, type RefObject } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

/** Pull distance (px) required to release into a refresh. */
export const PULL_REFRESH_THRESHOLD = 60;
/** Hard cap on how far the indicator can be dragged, for a "heavier" feel near the end. */
const MAX_PULL_DISTANCE = 90;
/** Higher = more finger travel needed per pixel of visual movement. */
const PULL_RESISTANCE = 1.6;

export interface PullToRefreshState {
  /** Current visual pull distance in px (0 while idle or refreshing settles back to threshold). */
  pullDistance: number;
  /** True from the moment the refresh is triggered until onRefresh resolves. */
  isRefreshing: boolean;
  /** True once the user has pulled past the threshold (will refresh on release). */
  isReady: boolean;
  /** True while the finger is actively dragging (used to disable snap-back transitions). */
  isDragging: boolean;
}

/**
 * Native touch-gesture pull-to-refresh for standalone PWA contexts, where the
 * browser's own overscroll refresh gesture isn't available (display: standalone
 * hides the chrome that normally drives it).
 *
 * Only activates on mobile viewports, when the given container is scrolled to
 * the top, and pulling down away from any inner scrollable content.
 */
export function usePullToRefresh(
  containerRef: RefObject<HTMLElement | null>,
  onRefresh: () => Promise<unknown> | unknown,
): PullToRefreshState {
  const isMobile = useIsMobile();
  const [pullDistance, setPullDistance] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startY = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  useEffect(() => {
    const container = containerRef.current;
    if (!isMobile || !container) return;

    const reset = () => {
      startY.current = null;
      pullDistanceRef.current = 0;
      setIsDragging(false);
      setPullDistance(0);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (isRefreshingRef.current || event.touches.length > 1) {
        startY.current = null;
        return;
      }
      if (container.scrollTop > 0) {
        startY.current = null;
        return;
      }
      startY.current = event.touches[0].clientY;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (startY.current === null || isRefreshingRef.current) return;

      const delta = event.touches[0].clientY - startY.current;

      if (delta <= 0 || container.scrollTop > 0) {
        if (pullDistanceRef.current > 0) reset();
        else startY.current = null;
        return;
      }

      event.preventDefault();
      const dampened = Math.min(MAX_PULL_DISTANCE, delta / PULL_RESISTANCE);
      pullDistanceRef.current = dampened;
      setIsDragging(true);
      setPullDistance(dampened);
    };

    const onTouchEnd = () => {
      if (startY.current === null) return;
      startY.current = null;
      setIsDragging(false);

      if (pullDistanceRef.current >= PULL_REFRESH_THRESHOLD) {
        setIsRefreshing(true);
        setPullDistance(PULL_REFRESH_THRESHOLD);
        Promise.resolve(onRefreshRef.current()).finally(() => {
          setIsRefreshing(false);
          pullDistanceRef.current = 0;
          setPullDistance(0);
        });
      } else {
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [containerRef, isMobile]);

  return {
    pullDistance,
    isRefreshing,
    isReady: pullDistance >= PULL_REFRESH_THRESHOLD,
    isDragging,
  };
}
