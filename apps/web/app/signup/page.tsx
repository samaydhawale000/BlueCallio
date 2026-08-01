'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth.store';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function SignupPage() {
  const { setTokens } = useAuthStore();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function signup() {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', { email, password });
      setTokens(res.data.accessToken, res.data.refreshToken);
      router.push('/dashboard');
    } catch {
      setError('Signup failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  }

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
              onKeyDown={(e) => e.key === 'Enter' && signup()}
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && signup()}
            />

            <Button onClick={signup} loading={loading} size="lg" className="w-full mt-1">
              Create account
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
