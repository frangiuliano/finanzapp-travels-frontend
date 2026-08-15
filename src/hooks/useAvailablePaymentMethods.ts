import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import {
  PAYMENT_METHODS_CHANGED_EVENT,
  type PaymentMethodsChangedDetail,
} from '@/lib/payment-method-events';
import { paymentMethodsService } from '@/services/paymentMethodsService';
import { PaymentMethod } from '@/types/payment-method';

interface AvailablePaymentMethodsOptions {
  currentPaymentMethodId?: string;
  currentPaymentMethod?: PaymentMethod;
}

export function useAvailablePaymentMethods(
  boardId: string | undefined,
  options: AvailablePaymentMethodsOptions = {},
) {
  const { currentPaymentMethodId, currentPaymentMethod } = options;
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [
    unavailableCurrentPaymentMethodId,
    setUnavailableCurrentPaymentMethodId,
  ] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const loadPaymentMethods = useCallback(
    async (targetBoardId: string, cancelled: () => boolean) => {
      setIsLoading(true);
      try {
        const { paymentMethods: availableMethods } =
          await paymentMethodsService.getAvailableForBoard(targetBoardId);
        const methods = availableMethods.filter((method) => method.isActive);
        const currentIsUnavailable = Boolean(
          currentPaymentMethodId &&
          !methods.some((method) => method._id === currentPaymentMethodId),
        );

        if (
          currentIsUnavailable &&
          currentPaymentMethod &&
          currentPaymentMethod._id === currentPaymentMethodId
        ) {
          // Use the snapshot embedded in the expense. GET /payment-methods/:id
          // is intentionally owner-only and cannot safely resolve another
          // participant's hidden method.
          methods.push(currentPaymentMethod);
        }

        if (!cancelled()) {
          setPaymentMethods(methods);
          setUnavailableCurrentPaymentMethodId(
            currentIsUnavailable ? currentPaymentMethodId : undefined,
          );
        }
      } catch (error) {
        if (!cancelled()) {
          const axiosError = error as AxiosError<{ message?: string }>;
          toast.error(
            axiosError.response?.data?.message ||
              'Error al cargar medios de pago disponibles',
          );
          setPaymentMethods([]);
          setUnavailableCurrentPaymentMethodId(undefined);
        }
      } finally {
        if (!cancelled()) setIsLoading(false);
      }
    },
    [currentPaymentMethod, currentPaymentMethodId],
  );

  useEffect(() => {
    if (!boardId) {
      setPaymentMethods([]);
      setUnavailableCurrentPaymentMethodId(undefined);
      setIsLoading(false);
      return;
    }

    let stale = false;
    void loadPaymentMethods(boardId, () => stale);
    const handleChange = (event: Event) => {
      const { boardId: changedBoardId } =
        (event as CustomEvent<PaymentMethodsChangedDetail>).detail ?? {};
      if (!changedBoardId || changedBoardId === boardId) {
        void loadPaymentMethods(boardId, () => stale);
      }
    };
    window.addEventListener(PAYMENT_METHODS_CHANGED_EVENT, handleChange);

    return () => {
      stale = true;
      window.removeEventListener(PAYMENT_METHODS_CHANGED_EVENT, handleChange);
    };
  }, [boardId, loadPaymentMethods]);

  const refetch = useCallback(async () => {
    if (!boardId) {
      setPaymentMethods([]);
      return;
    }
    await loadPaymentMethods(boardId, () => false);
  }, [boardId, loadPaymentMethods]);

  return {
    paymentMethods,
    unavailableCurrentPaymentMethodId,
    isLoading,
    refetch,
  };
}
