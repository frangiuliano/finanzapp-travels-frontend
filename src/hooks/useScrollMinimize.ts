import { useEffect, useRef, useState } from 'react';

const SCROLL_DELTA_THRESHOLD = 10;
const MIN_SCROLL_Y = 56;
const MOBILE_MEDIA_QUERY = '(max-width: 767px)';

/**
 * Collapses floating chrome when the user scrolls down (iOS 26 tab bar behavior).
 */
export function useScrollMinimize(enabled = true) {
  const [minimized, setMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(MOBILE_MEDIA_QUERY).matches
      : false,
  );
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const onMediaChange = () => {
      setIsMobile(mediaQuery.matches);
    };

    onMediaChange();
    mediaQuery.addEventListener('change', onMediaChange);
    return () => mediaQuery.removeEventListener('change', onMediaChange);
  }, []);

  const active = enabled && isMobile;
  const navMinimized = active && minimized;

  useEffect(() => {
    if (!active) {
      return;
    }

    lastY.current = window.scrollY;

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;

        if (Math.abs(delta) >= SCROLL_DELTA_THRESHOLD) {
          if (delta > 0 && y > MIN_SCROLL_Y) {
            setMinimized(true);
          } else if (delta < 0) {
            setMinimized(false);
          }
          lastY.current = y;
        }

        ticking.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [active]);

  useEffect(() => {
    if (!active) {
      delete document.documentElement.dataset.navMinimized;
      return;
    }

    document.documentElement.dataset.navMinimized = navMinimized
      ? 'true'
      : 'false';
    return () => {
      delete document.documentElement.dataset.navMinimized;
    };
  }, [active, navMinimized]);

  return navMinimized;
}
