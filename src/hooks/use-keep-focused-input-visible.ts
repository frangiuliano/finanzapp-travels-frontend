import { type RefObject, useEffect } from 'react';

const VIEWPORT_MARGIN = 16;
const FOCUSABLE_FIELD_SELECTOR =
  'input, textarea, select, [contenteditable="true"]';

/** Keeps the active field visible by scrolling only its form body. */
export function useKeepFocusedInputVisible(
  scrollContainerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const viewport = window.visualViewport;

    const revealFocusedField = () => {
      const containerRect = scrollContainer.getBoundingClientRect();
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportBottom =
        viewportTop + (viewport?.height ?? window.innerHeight);
      const keyboardOcclusion = Math.max(
        containerRect.bottom - viewportBottom,
        0,
      );

      scrollContainer.style.setProperty(
        '--keyboard-occlusion',
        `${keyboardOcclusion}px`,
      );

      const activeElement = document.activeElement;
      if (
        !(activeElement instanceof HTMLElement) ||
        !activeElement.matches(FOCUSABLE_FIELD_SELECTOR) ||
        !scrollContainer.contains(activeElement)
      ) {
        return;
      }

      const fieldRect = activeElement.getBoundingClientRect();
      const visibleTop = Math.max(containerRect.top, viewportTop);
      const visibleBottom = Math.min(containerRect.bottom, viewportBottom);

      if (fieldRect.bottom > visibleBottom - VIEWPORT_MARGIN) {
        scrollContainer.scrollTop +=
          fieldRect.bottom - visibleBottom + VIEWPORT_MARGIN;
      } else if (fieldRect.top < visibleTop + VIEWPORT_MARGIN) {
        scrollContainer.scrollTop -=
          visibleTop + VIEWPORT_MARGIN - fieldRect.top;
      }
    };

    scrollContainer.addEventListener('focusin', revealFocusedField);
    viewport?.addEventListener('resize', revealFocusedField);
    viewport?.addEventListener('scroll', revealFocusedField);
    window.addEventListener('resize', revealFocusedField);

    return () => {
      scrollContainer.removeEventListener('focusin', revealFocusedField);
      viewport?.removeEventListener('resize', revealFocusedField);
      viewport?.removeEventListener('scroll', revealFocusedField);
      window.removeEventListener('resize', revealFocusedField);
      scrollContainer.style.removeProperty('--keyboard-occlusion');
    };
  }, [enabled, scrollContainerRef]);
}
