'use client';

import Link from 'next/link';
import { GoogleSignInButton } from '../components/ui/GoogleSignInButton';

export default function SignupPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#060B18' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 20%, rgba(139,92,246,0.07), transparent)' }}
      />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-mono font-bold text-white text-xl tracking-tight">
            BlueJoinet
          </Link>
          <p className="text-slate-500 text-sm mt-2">Create your account</p>
        </div>

        <div
          className="rounded-2xl border border-[#1A2642] p-8 flex flex-col gap-6 items-center"
          style={{ background: '#0D1421' }}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-2"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.15))', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              🚀
            </div>
            <p className="text-sm text-slate-400">
              Sign up with Google — no passwords, no setup.
            </p>
          </div>

          <GoogleSignInButton />
        </div>
      </div>
    </div>
  );
}
