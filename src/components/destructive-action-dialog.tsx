import { useState, type ReactNode } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DestructiveActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmIcon?: ReactNode;
  pendingLabel?: string;
  isPending?: boolean;
  confirmationText?: string;
  onConfirm: () => void | Promise<void>;
}

export function DestructiveActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Eliminar',
  confirmIcon,
  pendingLabel = 'Eliminando…',
  isPending = false,
  confirmationText,
  onConfirm,
}: DestructiveActionDialogProps) {
  const [typedConfirmation, setTypedConfirmation] = useState('');

  const confirmationMatches =
    !confirmationText || typedConfirmation.trim() === confirmationText;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) {
          if (!nextOpen) setTypedConfirmation('');
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        {confirmationText && (
          <div className="space-y-2">
            <Label htmlFor="destructive-confirmation">
              Escribí <strong>{confirmationText}</strong> para confirmar
            </Label>
            <Input
              id="destructive-confirmation"
              value={typedConfirmation}
              onChange={(event) => setTypedConfirmation(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              setTypedConfirmation('');
              void onConfirm();
            }}
            disabled={isPending || !confirmationMatches}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              (confirmIcon ?? <Trash2 className="size-4" aria-hidden />)
            )}
            {isPending ? pendingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
