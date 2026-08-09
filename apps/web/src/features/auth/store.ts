'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import * as authApi from './api';
import type { AuthUser } from './types';

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  verificationLink: string | null;
  hydrated: boolean;
  bootstrapping: boolean;
  setSession: (user: AuthUser, accessToken: string) => void;
  setVerificationLink: (link: string | null) => void;
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
      verificationLink: null,
      hydrated: false,
      bootstrapping: false,
      setSession: (user, accessToken) => set({ user, accessToken, verificationLink: null }),
      setVerificationLink: (verificationLink) => set({ verificationLink }),
      clearSession: () => set({ user: null, accessToken: null, verificationLink: null }),
      setHydrated: (value) => set({ hydrated: value }),
      bootstrap: async () => {
        if (get().bootstrapping) {
          return;
        }

        set({ bootstrapping: true });

        try {
          const token = get().accessToken;
          if (token) {
            try {
              const profile = await authApi.getProfile(token);
              set({ user: profile.user, accessToken: token, verificationLink: null });
              return;
            } catch {
              // Access token expired — try refresh cookie next.
            }
          }

          try {
            const session = await authApi.refreshSession();
            set({ user: session.user, accessToken: session.accessToken, verificationLink: null });
          } catch {
            set({ user: null, accessToken: null, verificationLink: null });
          }
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
          set({ user: null, accessToken: null, verificationLink: null });
        }
      },
    }),
    {
      name: 'mahatest-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        verificationLink: state.verificationLink,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
