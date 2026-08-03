import { useEffect } from 'react';

/**
 * Radix/Vaul can occasionally leave body scroll/pointer locks after a modal closes
 * (e.g. fast route changes on mobile PWA). Clear them when the app shell mounts.
 */
export function useClearStuckOverlayLocks() {
  useEffect(() => {
    document.body.style.pointerEvents = '';
    document.body.style.overflow = '';
    document.documentElement.style.pointerEvents = '';
    document.documentElement.style.overflow = '';

    return () => {
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
      document.documentElement.style.pointerEvents = '';
      document.documentElement.style.overflow = '';
    };
  }, []);
}
