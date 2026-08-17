import type { ReactNode } from 'react';
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'grid max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-[calc(100%-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-2xl p-0 sm:max-h-[90vh] sm:max-w-lg',
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
          className={cn(
            'min-h-0 overflow-y-auto overscroll-contain px-5 py-4 [padding-bottom:max(1rem,env(safe-area-inset-bottom))] sm:px-6',
            bodyClassName,
          )}
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
