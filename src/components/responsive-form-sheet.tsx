import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface ResponsiveFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** En mobile: drawer desde abajo (default) o dialog centrado. */
  mobilePresentation?: 'drawer' | 'dialog';
}

export function ResponsiveFormSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  mobilePresentation = 'drawer',
}: ResponsiveFormSheetProps) {
  const isMobile = useIsMobile();

  if (isMobile && mobilePresentation === 'dialog') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100%-2rem)] overflow-hidden sm:max-w-md">
          <DialogHeader className="shrink-0">
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>
          <div className="min-h-0 overflow-y-auto overscroll-contain pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pr-1">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            {description ? (
              <DrawerDescription>{description}</DrawerDescription>
            ) : null}
          </DrawerHeader>
          <div className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-md overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]"
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
        </SheetHeader>
        <div className="mt-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
