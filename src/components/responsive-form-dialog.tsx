import type { ComponentProps } from 'react';
import { FormDialog } from '@/components/form-dialog';
import { FormDrawer } from '@/components/form-drawer';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveFormDialogProps extends Omit<
  ComponentProps<typeof FormDialog>,
  'className'
> {
  mobileClassName?: string;
  desktopClassName?: string;
}

/** Primary forms float on mobile and slide in from the right on desktop. */
export function ResponsiveFormDialog({
  mobileClassName,
  desktopClassName,
  ...props
}: ResponsiveFormDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <FormDialog className={mobileClassName} {...props} />;
  }

  return <FormDrawer className={desktopClassName} {...props} />;
}
