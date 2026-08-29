export type ConfirmationAction = 'delete' | 'archive' | 'leave' | 'discard';

export interface ConfirmationRequest {
  title: string;
  description: string;
  confirmLabel: string;
  action?: ConfirmationAction;
  confirmationText?: string;
}

export interface ConfirmationEventDetail extends ConfirmationRequest {
  resolve: (confirmed: boolean) => void;
}

export const CONFIRMATION_REQUEST_EVENT = 'finanzapp:confirmation-request';

export function requestConfirmation(
  request: ConfirmationRequest,
): Promise<boolean> {
  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent<ConfirmationEventDetail>(CONFIRMATION_REQUEST_EVENT, {
        detail: { ...request, resolve },
      }),
    );
  });
}
