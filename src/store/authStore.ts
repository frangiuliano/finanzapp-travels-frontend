import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { saveOfflineIdentity } from '@/lib/offlineIdentity';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  pendingEmail?: string;
  activeBoardId?: string | null;
}

/**
 * 'live' = confirmed by the server just now (has a real access token).
 * 'cached' = seeded from the offline identity snapshot because the app
 * loaded with no connectivity; no access token, so no authenticated API
 * call can actually succeed until a live session is re-established.
 */
type AuthSource = 'live' | 'cached' | null;

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authSource: AuthSource;
  setAuth: (user: User, accessToken: string) => void;
  setOfflineAuth: (user: User) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      authSource: null,
      setAuth: (user, accessToken) => {
        saveOfflineIdentity(user);
        set({ user, accessToken, isAuthenticated: true, authSource: 'live' });
      },
      setOfflineAuth: (user) =>
        set({
          user,
          accessToken: null,
          isAuthenticated: true,
          authSource: 'cached',
        }),
      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          authSource: null,
        }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage-v2',
      partialize: () => ({}),
    },
  ),
);
