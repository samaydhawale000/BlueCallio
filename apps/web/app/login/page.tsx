'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Blocks, Monitor, Atom } from 'lucide-react';
import { GoogleSignInButton } from '../components/ui/GoogleSignInButton';
import { useAuthStore } from '../store/auth.store';
import logo from '../assets/images/logo.png';

const ARCHITECTURE = [
  {
    icon: Monitor,
    label: 'Hosted UI',
    desc: 'Ready-made meeting pages',
  },
  {
    icon: Atom,
    label: 'React Components',
    desc: 'Custom UI, zero WebRTC',
  },
  {
    icon: Blocks,
    label: 'Headless SDK',
    desc: 'Full control over calls',
  },
];

const TRUST_POINTS = [
  'Secure authentication',
  'Trusted by developers',
  'Transparent, predictable billing',
];

export default function LoginPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  // If already logged in, bounce back to the dashboard.
  useEffect(() => {
    if (!hasHydrated) return;
    if (token) {
      router.replace('/dashboard');
    }
  }, [hasHydrated, token, router]);

  return (
    <div className="min-h-screen" style={{ background: '#060B18' }}>
      <div className="min-h-screen grid lg:grid-cols-2">
        {/* ── Left: Branding / Architecture ── */}
        <div
          className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 20% 20%, rgba(99,102,241,0.12), transparent), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(139,92,246,0.08), transparent), #0A0F1E',
          }}
        >
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          {/* Top: brand */}
          <div className="relative flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            >
              <Image src={logo} alt="BlueJoinet" width={40} height={40} className="h-8 w-8 object-contain" />
            </div>
            <div>
              <p className="font-mono font-bold text-white text-lg tracking-tight">
                BlueJoinet
              </p>
              <p className="text-xs text-slate-500">Communication Infrastructure</p>
            </div>
          </div>

          {/* Middle: headline + architecture */}
          <div className="relative">
            <h1 className="text-4xl font-bold text-white leading-tight mb-3">
              One Backend.
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #818CF8, #C084FC)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Three Integration Modes.
              </span>
            </h1>
            <p className="text-slate-400 text-lg mb-10 max-w-md">
              Embed real-time voice and video into your product with a single
              REST + WebSocket backend.
            </p>

            {/* Architecture illustration */}
            <div
              className="rounded-2xl p-6 max-w-md"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(99,102,241,0.2)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <p className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-5">
                Architecture
              </p>
              <div className="flex flex-col gap-3">
                {ARCHITECTURE.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: 'rgba(13,20,33,0.8)', border: '1px solid #1A2642' }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
                        border: '1px solid rgba(99,102,241,0.25)',
                      }}
                    >
                    <item.icon size={18} strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom: trust */}
          <div className="relative flex flex-wrap gap-2">
            {TRUST_POINTS.map((point) => (
              <span
                key={point}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 px-3 py-1.5 rounded-full border border-[#1A2642]"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
                {point}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right: Login card ── */}
        <div
          className="relative flex items-center justify-center px-6 py-16"
          style={{ background: '#060B18' }}
        >
          {/* Glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 50% 40% at 50% 20%, rgba(99,102,241,0.07), transparent)',
            }}
          />

          <div className="relative w-full max-w-sm">
            {/* Mobile brand */}
            <div className="text-center mb-8 lg:hidden">
              <Link
                href="/"
                className="font-mono font-bold text-white text-xl tracking-tight"
              >
                BlueJoinet
              </Link>
              <p className="text-slate-500 text-sm mt-1">Communication Infrastructure</p>
            </div>

            {/* Card */}
            <div
              className="rounded-2xl border border-[#1A2642] p-8"
              style={{ background: '#0D1421', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}
            >
              <div className="flex flex-col items-center gap-2 text-center mb-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-1"
                >
                  <Image src={logo} alt="BlueJoinet" width={48} height={48} className="h-9 w-9 object-contain" />
                </div>
                <h2 className="text-lg font-bold text-white">Welcome back</h2>
                <p className="text-sm text-slate-400">
                  Sign in to access your dashboard.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <GoogleSignInButton />

                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1" style={{ height: '1px', background: '#1A2642' }} />
                  <span className="text-xs text-slate-600 uppercase tracking-widest">
                    or
                  </span>
                  <div className="flex-1" style={{ height: '1px', background: '#1A2642' }} />
                </div>

                <p className="text-center text-xs text-slate-500">
                  No passwords. No setup.{' '}
                  <Link
                    href="/signup"
                    className="font-medium text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Create an account
                  </Link>
                </p>
              </div>
            </div>

            <p className="text-center text-xs text-slate-600 mt-6">
              By continuing you agree to our{' '}
              <Link href="/terms" className="hover:text-slate-400 transition-colors">
                Terms
              </Link>{' '}
              &amp;{' '}
              <Link href="/privacy" className="hover:text-slate-400 transition-colors">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
