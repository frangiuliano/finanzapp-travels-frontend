import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { paymentMethodsService } from '@/services/paymentMethodsService';
import { PaymentMethod } from '@/types/payment-method';

export function useAvailablePaymentMethods(boardId: string | undefined) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPaymentMethods = useCallback(async () => {
    if (!boardId) {
      setPaymentMethods([]);
      return;
    }

    setIsLoading(true);
    try {
      const { paymentMethods: methods } =
        await paymentMethodsService.getAvailableForBoard(boardId);
      setPaymentMethods(methods.filter((method) => method.isActive));
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(
        axiosError.response?.data?.message ||
          'Error al cargar medios de pago disponibles',
      );
      setPaymentMethods([]);
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    void fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  return {
    paymentMethods,
    isLoading,
    refetch: fetchPaymentMethods,
  };
}
