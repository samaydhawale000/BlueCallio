'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth.store';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function LoginPage() {
  const { setTokens } = useAuthStore();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function login() {
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      setTokens(response.data.accessToken, response.data.refreshToken);
      router.push('/dashboard');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#060B18' }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 20%, rgba(99,102,241,0.08), transparent)' }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="font-mono font-bold text-white text-xl tracking-tight">
            BlueJoinet
          </Link>
          <p className="text-slate-500 text-sm mt-2">Sign in to your account</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border border-[#1A2642] p-8"
          style={{ background: '#0D1421' }}
        >
          <div className="flex flex-col gap-5">
            {error && (
              <div
                className="text-sm text-red-400 px-4 py-3 rounded-lg border border-red-500/20"
                style={{ background: 'rgba(239,68,68,0.06)' }}
              >
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
            />

            <Button
              onClick={login}
              loading={loading}
              size="lg"
              className="w-full mt-1"
            >
              Sign in
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
