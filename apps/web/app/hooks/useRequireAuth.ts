'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth.store';

/**
 * Redirects to /login if the user is not authenticated.
 * Waits for zustand persist rehydration to complete before deciding,
 * so a hard refresh on /dashboard no longer bounces to /login.
 */
export function useRequireAuth() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    // Wait until the persisted session has been restored from localStorage.
    if (!hasHydrated) return;

    if (!token) {
      router.replace('/login');
    }
  }, [hasHydrated, token, router]);

  return { isAuthed: hasHydrated && !!token, isReady: hasHydrated };
}
