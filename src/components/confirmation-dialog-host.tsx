import { useEffect, useState } from 'react';
import { Archive, LogOut, Trash2, XCircle } from 'lucide-react';
import { DestructiveActionDialog } from '@/components/destructive-action-dialog';
import {
  CONFIRMATION_REQUEST_EVENT,
  type ConfirmationEventDetail,
} from '@/lib/confirmation-events';

export function ConfirmationDialogHost() {
  const [request, setRequest] = useState<ConfirmationEventDetail | null>(null);

  useEffect(() => {
    const handleRequest = (event: Event) => {
      const nextRequest = (event as CustomEvent<ConfirmationEventDetail>)
        .detail;
      setRequest((current) => {
        current?.resolve(false);
        return nextRequest;
      });
    };

    window.addEventListener(CONFIRMATION_REQUEST_EVENT, handleRequest);
    return () =>
      window.removeEventListener(CONFIRMATION_REQUEST_EVENT, handleRequest);
  }, []);

  const resolve = (confirmed: boolean) => {
    request?.resolve(confirmed);
    setRequest(null);
  };

  const confirmIcon =
    request?.action === 'archive' ? (
      <Archive className="size-4" aria-hidden />
    ) : request?.action === 'leave' ? (
      <LogOut className="size-4" aria-hidden />
    ) : request?.action === 'discard' ? (
      <XCircle className="size-4" aria-hidden />
    ) : (
      <Trash2 className="size-4" aria-hidden />
    );

  return (
    <DestructiveActionDialog
      open={request !== null}
      onOpenChange={(open) => {
        if (!open) resolve(false);
      }}
      title={request?.title ?? 'Confirmar acción'}
      description={request?.description ?? ''}
      confirmLabel={request?.confirmLabel}
      confirmIcon={confirmIcon}
      confirmationText={request?.confirmationText}
      onConfirm={() => resolve(true)}
    />
  );
}
