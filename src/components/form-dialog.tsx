import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** Shared floating shell for primary create/edit forms. */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  bodyClassName,
}: FormDialogProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  const keepActiveControlVisible = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;

      const body = bodyRef.current;
      if (!body) return;

      const viewport = window.visualViewport;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportBottom =
        viewportTop + (viewport?.height ?? window.innerHeight);
      const bodyRect = body.getBoundingClientRect();
      const occludedHeight = Math.max(0, bodyRect.bottom - viewportBottom);
      body.style.setProperty(
        '--form-dialog-keyboard-inset',
        `${occludedHeight}px`,
      );

      const activeElement = document.activeElement;
      if (
        !(activeElement instanceof HTMLElement) ||
        !body.contains(activeElement) ||
        !activeElement.matches(
          'input, textarea, select, [contenteditable="true"]',
        )
      ) {
        return;
      }

      const controlRect = activeElement.getBoundingClientRect();
      const margin = 12;
      const visibleTop = Math.max(bodyRect.top, viewportTop) + margin;
      const visibleBottom = Math.min(bodyRect.bottom, viewportBottom) - margin;

      if (visibleBottom <= visibleTop) return;

      if (controlRect.bottom > visibleBottom) {
        body.scrollTop += controlRect.bottom - visibleBottom;
      } else if (controlRect.top < visibleTop) {
        body.scrollTop += controlRect.top - visibleTop;
      }
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    const viewport = window.visualViewport;
    const body = bodyRef.current;
    viewport?.addEventListener('resize', keepActiveControlVisible);
    viewport?.addEventListener('scroll', keepActiveControlVisible);

    return () => {
      viewport?.removeEventListener('resize', keepActiveControlVisible);
      viewport?.removeEventListener('scroll', keepActiveControlVisible);
      body?.style.removeProperty('--form-dialog-keyboard-inset');
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [keepActiveControlVisible, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'grid max-h-[calc(100svh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-[calc(100%-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-2xl p-0 sm:max-h-[90vh] sm:max-w-lg',
          className,
        )}
      >
        <DialogHeader className="shrink-0 border-b px-5 py-4 pr-14 text-left sm:px-6">
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div
          ref={bodyRef}
          onFocusCapture={keepActiveControlVisible}
          className={cn(
            'min-h-0 overflow-y-auto overscroll-contain px-5 py-4 [padding-bottom:calc(max(1rem,env(safe-area-inset-bottom))+var(--form-dialog-keyboard-inset,0px))] sm:px-6',
            bodyClassName,
          )}
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
