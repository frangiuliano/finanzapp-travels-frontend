import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

const publicPaths = new Set([
  '/login',
  '/signup',
  '/forgot-password',
  '/verify-email',
]);

function isPublicAuthPath(path: string): boolean {
  if (publicPaths.has(path)) {
    return true;
  }

  return (
    path.startsWith('/auth/verify-email/') ||
    path.startsWith('/auth/reset-password') ||
    path.startsWith('/trips/invitation/')
  );
}

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setAuth, setLoading, clearAuth } =
    useAuthStore();

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      setLoading(true);
      const { accessToken: currentToken } = useAuthStore.getState();

      if (currentToken) {
        try {
          const refreshRes = await api.post(
            '/auth/refresh',
            {},
            { withCredentials: true },
          );
          const { accessToken: newToken, user: refreshedUser } =
            refreshRes.data;
          if (!cancelled && refreshedUser && newToken) {
            setAuth(refreshedUser, newToken);
            try {
              const profileRes = await api.get('/auth/me');
              if (!cancelled) {
                setAuth(profileRes.data, newToken);
              }
            } catch {
              // keep partial user from refresh
            }
          }
          return;
        } catch {
          // refresh failed, try /me with current token
        }

        try {
          const response = await api.get('/auth/me');
          const token = useAuthStore.getState().accessToken;
          if (!cancelled) {
            if (response.data && token) {
              setAuth(response.data, token);
            } else {
              clearAuth();
            }
          }
        } catch {
          if (!cancelled) {
            clearAuth();
          }
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
        if (!cancelled && refreshedUser && accessToken) {
          setAuth(refreshedUser, accessToken);
          try {
            const profileRes = await api.get('/auth/me');
            if (!cancelled) {
              setAuth(profileRes.data, accessToken);
            }
          } catch {
            // keep partial user from refresh
          }
        } else if (!cancelled) {
          clearAuth();
        }
      } catch {
        if (!cancelled) {
          const path = window.location.pathname;
          if (!isPublicAuthPath(path)) {
            clearAuth();
          }
        }
      }
    };

    const runWhenHydrated = () => {
      if (cancelled) return;
      checkAuth().finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    };

    if (useAuthStore.persist.hasHydrated()) {
      runWhenHydrated();
      return () => {
        cancelled = true;
      };
    }

    const unsubscribe = useAuthStore.persist.onFinishHydration(runWhenHydrated);
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [clearAuth, setAuth, setLoading]);

  return {
    user,
    isAuthenticated,
    isLoading,
  };
};
