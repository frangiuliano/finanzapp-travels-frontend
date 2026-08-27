import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

const publicPaths = new Set([
  '/login',
  '/signup',
  '/forgot-password',
  '/verify-email',
]);

export function isPublicAuthPath(path: string): boolean {
  if (publicPaths.has(path)) {
    return true;
  }

  return (
    path.startsWith('/auth/verify-email/') ||
    path.startsWith('/auth/reset-password') ||
    path.startsWith('/trips/invitation/') ||
    path.startsWith('/boards/invitation/')
  );
}

let bootstrapPromise: Promise<void> | null = null;

async function runAuthBootstrap(): Promise<void> {
  const {
    accessToken: currentToken,
    setAuth,
    clearAuth,
  } = useAuthStore.getState();

  if (currentToken) {
    try {
      const refreshRes = await api.post(
        '/auth/refresh',
        {},
        { withCredentials: true },
      );
      const { accessToken: newToken, user: refreshedUser } = refreshRes.data;
      if (refreshedUser && newToken) {
        setAuth(refreshedUser, newToken);
        try {
          const profileRes = await api.get('/auth/me');
          setAuth(profileRes.data, newToken);
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
      if (response.data && token) {
        setAuth(response.data, token);
      } else {
        clearAuth();
      }
    } catch {
      clearAuth();
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
      try {
        const profileRes = await api.get('/auth/me');
        setAuth(profileRes.data, accessToken);
      } catch {
        // keep partial user from refresh
      }
    } else {
      clearAuth();
    }
  } catch {
    const path = window.location.pathname;
    if (!isPublicAuthPath(path)) {
      clearAuth();
    }
  }
}

function ensureAuthBootstrapped(): Promise<void> {
  if (!bootstrapPromise) {
    useAuthStore.getState().setLoading(true);
    bootstrapPromise = runAuthBootstrap().finally(() => {
      useAuthStore.getState().setLoading(false);
    });
  }

  return bootstrapPromise;
}

export const useAuth = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    const runWhenHydrated = () => {
      ensureAuthBootstrapped();
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
