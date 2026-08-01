import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { paymentMethodsService } from '@/services/paymentMethodsService';
import { PaymentMethod } from '@/types/payment-method';

export function useAvailablePaymentMethods(boardId: string | undefined) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPaymentMethods = useCallback(
    async (targetBoardId: string, cancelled: () => boolean) => {
      setIsLoading(true);
      try {
        const { paymentMethods: methods } =
          await paymentMethodsService.getAvailableForBoard(targetBoardId);
        if (!cancelled()) {
          setPaymentMethods(methods.filter((method) => method.isActive));
        }
      } catch (error) {
        if (!cancelled()) {
          const axiosError = error as AxiosError<{ message?: string }>;
          toast.error(
            axiosError.response?.data?.message ||
              'Error al cargar medios de pago disponibles',
          );
          setPaymentMethods([]);
        }
      } finally {
        if (!cancelled()) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!boardId) {
      setPaymentMethods([]);
      setIsLoading(false);
      return;
    }

    let stale = false;
    void loadPaymentMethods(boardId, () => stale);

    return () => {
      stale = true;
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
    isLoading,
    refetch,
  };
}
