import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { categoriesService } from '@/services/categoriesService';
import { Category } from '@/types/category';
import {
  getBoardScopedCache,
  saveBoardScopedCache,
} from '@/lib/board-scoped-cache';

const CACHE_NAMESPACE = 'categories';

export function useBoardCategories(boardId: string | undefined) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCategories = useCallback(
    async (targetBoardId: string, cancelled: () => boolean) => {
      setIsLoading(true);
      try {
        const { categories: items } =
          await categoriesService.getByBoard(targetBoardId);
        const active = items.filter((category) => category.isActive);
        saveBoardScopedCache(CACHE_NAMESPACE, targetBoardId, active);
        if (!cancelled()) {
          setCategories(active);
        }
      } catch (error) {
        const cached = getBoardScopedCache<Category[]>(
          CACHE_NAMESPACE,
          targetBoardId,
        );
        if (cached && cached.length > 0) {
          if (!cancelled()) {
            setCategories(cached);
          }
          return;
        }
        if (!cancelled()) {
          const axiosError = error as AxiosError<{ message?: string }>;
          toast.error(
            axiosError.response?.data?.message ||
              'Error al cargar categorías del tablero',
          );
          setCategories([]);
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
      setCategories([]);
      setIsLoading(false);
      return;
    }

    let stale = false;
    void loadCategories(boardId, () => stale);

    return () => {
      stale = true;
    };
  }, [boardId, loadCategories]);

  const refetch = useCallback(async () => {
    if (!boardId) {
      setCategories([]);
      return;
    }

    await loadCategories(boardId, () => false);
  }, [boardId, loadCategories]);

  return {
    categories,
    isLoading,
    refetch,
  };
}
