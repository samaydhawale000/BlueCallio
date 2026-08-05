import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  hasHydrated: boolean;
  setTokens: (access: string, refresh: string) => void;
  setToken: (token: string) => void;
  setHasHydrated: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      hasHydrated: false,
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      setToken: (token) => set({ token }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      logout: () => set({ token: null, refreshToken: null }),
    }),
    {
      name: 'BlueJoinet-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
