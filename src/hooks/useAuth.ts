import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setAuth, setLoading, clearAuth } =
    useAuthStore();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (hasCheckedRef.current) {
      return;
    }

    const checkAuth = async () => {
      hasCheckedRef.current = true;

      const currentToken = useAuthStore.getState().accessToken;
      if (isAuthenticated && user && currentToken) {
        setLoading(false);
        return;
      }

      if (!currentToken) {
        clearAuth();
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get('/auth/me');
        if (response.data && currentToken) {
          setAuth(response.data, currentToken);
        } else {
          clearAuth();
        }
      } catch (error) {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
  };
};
