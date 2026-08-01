import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  setTokens: (access: string, refresh: string) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      setToken: (token) => set({ token }),
      logout: () => set({ token: null, refreshToken: null }),
    }),
    { name: 'BlueJoinet-auth' },
  ),
);
