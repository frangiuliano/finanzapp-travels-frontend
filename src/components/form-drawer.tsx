import type { ReactNode } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface FormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** Shared right-side shell for primary desktop create/edit forms. */
export function FormDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  bodyClassName,
}: FormDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'grid w-full max-w-lg grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0',
          className,
        )}
      >
        <SheetHeader className="shrink-0 border-b px-6 py-5 pr-14 text-left">
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
        </SheetHeader>
        <div
          className={cn(
            'min-h-0 overflow-y-auto overscroll-contain px-6 py-5',
            bodyClassName,
          )}
        >
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
