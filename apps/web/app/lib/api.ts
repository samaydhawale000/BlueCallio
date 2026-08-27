import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005',
});

api.interceptors.request.use((config) => {
  let token = useAuthStore.getState().token;

  // Zustand persist rehydration is async — fall back to localStorage directly
  // during the window between page load and hydration completing.
  if (!token && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('BlueCallio-auth');
      token = raw ? JSON.parse(raw)?.state?.token ?? null : null;
    } catch {
      // ignore malformed data
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function drainQueue(token: string | null, err: unknown) {
  pendingQueue.forEach((p) => (token ? p.resolve(token) : p.reject(err)));
  pendingQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const { refreshToken, setTokens, logout } = useAuthStore.getState();

    if (!refreshToken) {
      logout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'}/auth/refresh`,
        { refreshToken },
      );
      const { accessToken, refreshToken: newRefresh } = res.data;
      setTokens(accessToken, newRefresh);
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      drainQueue(accessToken, null);
      original.headers.Authorization = `Bearer ${accessToken}`;
      return api(original);
    } catch (err) {
      drainQueue(null, err);
      logout();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);
