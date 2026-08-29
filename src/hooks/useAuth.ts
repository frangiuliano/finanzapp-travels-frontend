import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { isDefiniteAuthFailure } from '@/lib/network';
import {
  getOfflineIdentity,
  clearOfflineIdentity,
} from '@/lib/offlineIdentity';

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
    path.startsWith('/auth/confirm-email-change') ||
    path.startsWith('/auth/reset-password') ||
    path.startsWith('/trips/invitation/') ||
    path.startsWith('/boards/invitation/')
  );
}

let bootstrapPromise: Promise<void> | null = null;

function logoutForInvalidSession(): void {
  useAuthStore.getState().clearAuth();
  clearOfflineIdentity();
}

async function runAuthBootstrap(): Promise<void> {
  const {
    accessToken: currentToken,
    setAuth,
    setOfflineAuth,
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
    } catch (error) {
      // A network/server hiccup doesn't prove the session is invalid —
      // keep the session we already had in memory and try again later.
      if (!isDefiniteAuthFailure(error)) {
        return;
      }
      // refresh explicitly rejected, try /me with the current token as a
      // last resort before giving up
    }

    // The refresh token is already confirmed invalid at this point. The
    // current access token might still have a minute or two left, so try
    // it once as a grace period — but any outcome other than a working
    // token means there's no valid path forward, so log out either way.
    try {
      const response = await api.get('/auth/me');
      const token = useAuthStore.getState().accessToken;
      if (response.data && token) {
        setAuth(response.data, token);
        return;
      }
    } catch {
      // fall through to logout below
    }
    logoutForInvalidSession();
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
      logoutForInvalidSession();
    }
  } catch (error) {
    if (isDefiniteAuthFailure(error)) {
      // The server explicitly rejected the session — no cached identity
      // should survive that.
      const path = window.location.pathname;
      if (!isPublicAuthPath(path)) {
        logoutForInvalidSession();
      }
      return;
    }

    // Couldn't reach the server to confirm anything (network error, server
    // down). `navigator.onLine` isn't reliable enough to gate this on, so
    // fall back to the last known identity whenever one exists rather than
    // stranding the user on the login screen.
    const cached = getOfflineIdentity();
    if (cached) {
      setOfflineAuth(cached);
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
