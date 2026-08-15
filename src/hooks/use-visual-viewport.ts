import { useEffect } from 'react';

/**
 * Exposes the browser's visible viewport to portalled overlays.
 *
 * On iOS the layout viewport stays full-height while the software keyboard
 * shrinks and offsets `visualViewport`, so viewport units alone cannot keep a
 * fixed dialog inside the area the user can actually see.
 */
export function useVisualViewportVariables() {
  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;

    const updateViewportVariables = () => {
      const height = viewport?.height ?? window.innerHeight;
      const offsetTop = viewport?.offsetTop ?? 0;

      root.style.setProperty('--visual-viewport-height', `${height}px`);
      root.style.setProperty('--visual-viewport-offset-top', `${offsetTop}px`);
    };

    updateViewportVariables();
    viewport?.addEventListener('resize', updateViewportVariables);
    viewport?.addEventListener('scroll', updateViewportVariables);
    window.addEventListener('resize', updateViewportVariables);

    return () => {
      viewport?.removeEventListener('resize', updateViewportVariables);
      viewport?.removeEventListener('scroll', updateViewportVariables);
      window.removeEventListener('resize', updateViewportVariables);
      root.style.removeProperty('--visual-viewport-height');
      root.style.removeProperty('--visual-viewport-offset-top');
    };
  }, []);
}
