import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../api/auth.api';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens as setStoredTokens,
} from '../lib/auth-tokens';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (access: string | null, refresh: string | null) => void;
  refreshFromStorage: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: authService.isAuthenticated(),
      accessToken: getAccessToken(),
      refreshToken: getRefreshToken(),
      setTokens: (access, refresh) => {
        setStoredTokens(access, refresh);
        set({
          accessToken: access,
          refreshToken: refresh,
          isAuthenticated: Boolean(access),
        });
      },
      refreshFromStorage: () => {
        const access = getAccessToken();
        const refresh = getRefreshToken();
        set({
          accessToken: access,
          refreshToken: refresh,
          isAuthenticated: Boolean(access),
        });
      },
      logout: () => {
        authService.logout();
        set({ accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-store',
    },
  ),
);
