import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function hasBlockingOverlayOpen(): boolean {
  return Boolean(
    document.querySelector(
      [
        '[role="dialog"][data-state="open"]',
        '[data-vaul-drawer-visible="true"]',
        // Select/Dropdown use RemoveScroll (body pointer-events: none).
        // Clearing those locks while they are open fights Radix in a loop.
        '[role="listbox"][data-state="open"]',
        '[data-radix-select-viewport]',
        '[data-radix-menu-content][data-state="open"]',
      ].join(','),
    ),
  );
}

export function clearStuckOverlayLocks() {
  if (hasBlockingOverlayOpen()) {
    return;
  }

  document.body.style.pointerEvents = '';
  document.body.style.overflow = '';
  document.documentElement.style.pointerEvents = '';
  document.documentElement.style.overflow = '';
  document.body.removeAttribute('data-scroll-locked');
  document.documentElement.removeAttribute('data-scroll-locked');
  document.body.removeAttribute('data-scroll-locked-ignore');
}

/**
 * Radix modal menus/dialogs can leave pointer-events:none on <body>.
 * Release those locks after navigation and pointer interactions.
 */
export function useClearStuckOverlayLocks() {
  const location = useLocation();

  useEffect(() => {
    clearStuckOverlayLocks();
  }, [location.pathname]);

  useEffect(() => {
    const releaseIfStuck = () => {
      window.requestAnimationFrame(() => {
        const bodyStyle = window.getComputedStyle(document.body);
        const htmlStyle = window.getComputedStyle(document.documentElement);
        const blocked =
          bodyStyle.pointerEvents === 'none' ||
          htmlStyle.pointerEvents === 'none' ||
          document.body.hasAttribute('data-scroll-locked');

        if (blocked) {
          clearStuckOverlayLocks();
        }
      });
    };

    window.addEventListener('pointerup', releaseIfStuck);
    window.addEventListener('keydown', releaseIfStuck);

    return () => {
      window.removeEventListener('pointerup', releaseIfStuck);
      window.removeEventListener('keydown', releaseIfStuck);
    };
  }, []);
}
