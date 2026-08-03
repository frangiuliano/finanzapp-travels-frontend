import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function hasOpenOverlay(): boolean {
  return Boolean(
    document.querySelector(
      [
        '[data-state="open"][role="dialog"]',
        '[data-state="open"][data-vaul-drawer]',
        '[data-radix-menu-content][data-state="open"]',
        '[data-radix-select-content][data-state="open"]',
      ].join(','),
    ),
  );
}

export function clearStuckOverlayLocks() {
  if (hasOpenOverlay()) {
    return;
  }

  document.body.style.pointerEvents = '';
  document.body.style.overflow = '';
  document.documentElement.style.pointerEvents = '';
  document.documentElement.style.overflow = '';
  document.body.removeAttribute('data-scroll-locked');
  document.documentElement.removeAttribute('data-scroll-locked');

  document
    .querySelectorAll<HTMLElement>(
      [
        '.glass-overlay',
        '[data-radix-dialog-overlay]',
        '[data-vaul-overlay]',
      ].join(','),
    )
    .forEach((element) => {
      const state = element.getAttribute('data-state');
      if (!state || state === 'closed') {
        element.style.pointerEvents = 'none';
      }
    });
}

/**
 * Radix/Vaul can leave body scroll/pointer locks after a modal closes.
 * Clear them on navigation and before pointer events when no overlay is open.
 */
export function useClearStuckOverlayLocks() {
  const location = useLocation();

  useEffect(() => {
    clearStuckOverlayLocks();
  }, [location.pathname]);

  useEffect(() => {
    const onPointerDownCapture = () => {
      const bodyBlocked =
        document.body.style.pointerEvents === 'none' ||
        document.documentElement.style.pointerEvents === 'none' ||
        document.body.hasAttribute('data-scroll-locked');

      if (bodyBlocked && !hasOpenOverlay()) {
        clearStuckOverlayLocks();
      }
    };

    window.addEventListener('pointerdown', onPointerDownCapture, true);
    return () =>
      window.removeEventListener('pointerdown', onPointerDownCapture, true);
  }, []);
}
