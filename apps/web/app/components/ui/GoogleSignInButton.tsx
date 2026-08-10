'use client';

import { useEffect, useRef } from 'react';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

export function GoogleSignInButton() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { renderButton, loading, error, clientId, gsiReady } = useGoogleAuth();

  useEffect(() => {
    if (clientId && gsiReady && ref.current) {
      renderButton(ref.current);
    }
  }, [clientId, gsiReady, renderButton]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={ref} className="flex justify-center min-h-[40px]" />
      {loading && (
        <p className="text-sm text-slate-500">Signing you in…</p>
      )}
      {error && (
        <div
          className="text-sm text-red-400 px-4 py-3 rounded-lg border border-red-500/20 w-full"
          style={{ background: 'rgba(239,68,68,0.06)' }}
        >
          {error}
        </div>
      )}
      {!clientId && (
        <p className="text-xs text-slate-600 text-center">
          Google sign-in is not configured. Add{' '}
          <code className="text-violet-400">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to continue.
        </p>
      )}
    </div>
  );
}
