import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function clearStuckOverlayLocks() {
  document.body.style.pointerEvents = '';
  document.body.style.overflow = '';
  document.documentElement.style.pointerEvents = '';
  document.documentElement.style.overflow = '';
  document.body.removeAttribute('data-scroll-locked');
  document.documentElement.removeAttribute('data-scroll-locked');

  document
    .querySelectorAll<HTMLElement>(
      '[data-radix-dialog-overlay], [data-radix-dialog-content], [data-vaul-overlay], [data-vaul-drawer]',
    )
    .forEach((element) => {
      const state = element.getAttribute('data-state');
      if (state === 'closed') {
        element.style.pointerEvents = 'none';
      }
    });
}

/**
 * Radix/Vaul can leave body scroll/pointer locks after a modal closes
 * (e.g. fast route changes on mobile PWA). Clear them on shell mount and navigation.
 */
export function useClearStuckOverlayLocks() {
  const location = useLocation();

  useEffect(() => {
    clearStuckOverlayLocks();
  }, [location.pathname]);
}
