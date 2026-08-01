import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
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
}

export function ResponsiveFormSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: ResponsiveFormSheetProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            {description ? (
              <DrawerDescription>{description}</DrawerDescription>
            ) : null}
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-8">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
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
