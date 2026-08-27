import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  userId: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  hasHydrated: boolean;
  setTokens: (access: string, refresh: string) => void;
  setToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  setHasHydrated: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      hasHydrated: false,
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      logout: () =>
        set({ token: null, refreshToken: null, user: null }),
    }),
    {
      name: 'BlueCallio-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
