import { type ReactNode, useRef } from 'react';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useKeepFocusedInputVisible } from '@/hooks/use-keep-focused-input-visible';
import { cn } from '@/lib/utils';

interface FormDialogContentProps {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  headerLeading?: ReactNode;
  keepFocusedInputVisible?: boolean;
}

/** Shared floating shell for creation and editing forms. */
export function FormDialogContent({
  open,
  title,
  description,
  children,
  className,
  headerLeading,
  keepFocusedInputVisible = true,
}: FormDialogContentProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  useKeepFocusedInputVisible(bodyRef, open && keepFocusedInputVisible);

  return (
    <DialogContent
      className={cn(
        'form-dialog w-[calc(100%-2rem)] rounded-3xl p-0 sm:max-w-lg',
        className,
      )}
    >
      <DialogHeader className="shrink-0 border-b px-6 py-4 pr-12 text-left">
        {headerLeading}
        <DialogTitle>{title}</DialogTitle>
        {description ? (
          <DialogDescription>{description}</DialogDescription>
        ) : null}
      </DialogHeader>
      <div
        ref={bodyRef}
        className="form-dialog-scroll-body min-h-0 shrink overflow-y-auto overscroll-contain px-6 py-4"
      >
        {children}
      </div>
    </DialogContent>
  );
}
