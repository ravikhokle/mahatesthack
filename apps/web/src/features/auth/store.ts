'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import * as authApi from './api';
import type { AuthUser } from './types';

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  hydrated: boolean;
  bootstrapping: boolean;
  setSession: (user: AuthUser, accessToken: string) => void;
  clearSession: () => void;
  setHydrated: (value: boolean) => void;
  bootstrap: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      hydrated: false,
      bootstrapping: false,
      setSession: (user, accessToken) =>
        set({ user, accessToken, hydrated: true }),
      clearSession: () => set({ user: null, accessToken: null }),
      setHydrated: (value) => set({ hydrated: value }),
      bootstrap: async () => {
        if (get().bootstrapping) {
          return;
        }

        set({ bootstrapping: true });

        try {
          // Try to restore session via the httpOnly refresh cookie.
          // Whether the user is already in localStorage or not, we always refresh
          // to ensure the access token is valid and the server session is active.
          const session = await authApi.refreshSession();
          set({ user: session.user, accessToken: session.accessToken });
        } catch {
          // Refresh cookie is missing, expired, or revoked — clear any stale local state.
          set({ user: null, accessToken: null });
        } finally {
          set({ bootstrapping: false, hydrated: true });
        }
      },
      logout: async () => {
        const token = get().accessToken;
        try {
          if (token) {
            await authApi.logout(token);
          }
        } catch {
          // Still clear local session if API logout fails.
        } finally {
          set({ user: null, accessToken: null });
        }
      },
    }),
    {
      name: 'mahatest-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
