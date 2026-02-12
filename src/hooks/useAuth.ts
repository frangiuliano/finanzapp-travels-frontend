import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

const hasCheckedRef = { current: false };

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setAuth, setLoading, clearAuth } =
    useAuthStore();

  useEffect(() => {
    if (hasCheckedRef.current) return;

    const checkAuth = async () => {
      hasCheckedRef.current = true;
      const { accessToken: currentToken } = useAuthStore.getState();
      setLoading(true);

      if (currentToken) {
        try {
          const refreshRes = await api.post(
            '/auth/refresh',
            {},
            { withCredentials: true },
          );
          const { accessToken: newToken, user: refreshedUser } =
            refreshRes.data;
          if (refreshedUser && newToken) {
            setAuth(refreshedUser, newToken);
            setLoading(false);
            return;
          }
        } catch {
          // refresh failed, try /me with current token
        }
        try {
          const response = await api.get('/auth/me');
          const token = useAuthStore.getState().accessToken;
          if (response.data && token) {
            setAuth(response.data, token);
          } else {
            clearAuth();
          }
        } catch {
          clearAuth();
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        const response = await api.post(
          '/auth/refresh',
          {},
          { withCredentials: true },
        );
        const { accessToken, user: refreshedUser } = response.data;
        if (refreshedUser && accessToken) {
          setAuth(refreshedUser, accessToken);
        } else {
          clearAuth();
        }
      } catch {
        const path = window.location.pathname;
        if (path !== '/login' && path !== '/signup') {
          clearAuth();
        }
      } finally {
        setLoading(false);
      }
    };

    const runWhenHydrated = () => {
      if (hasCheckedRef.current) return;
      checkAuth();
    };

    if (useAuthStore.persist.hasHydrated()) {
      runWhenHydrated();
      return;
    }

    const unsubscribe = useAuthStore.persist.onFinishHydration(runWhenHydrated);
    return () => unsubscribe?.();
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
  };
};
