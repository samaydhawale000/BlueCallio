'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, LockKeyhole, ChartNoAxesCombined } from 'lucide-react';
import { GoogleSignInButton } from '../components/ui/GoogleSignInButton';
import { useAuthStore } from '../store/auth.store';
import logo from '../assets/images/logo.png';

const BENEFITS = [
  {
    icon: Zap,
    label: 'Instant setup',
    desc: 'Create a project and get your API key in minutes',
  },
  {
    icon: LockKeyhole,
    label: 'Secure by default',
    desc: 'HMAC-signed webhooks & time-limited TURN credentials',
  },
  {
    icon: ChartNoAxesCombined,
    label: 'Developer-first',
    desc: 'Clear docs, REST API, and a dashboard built for you',
  },
];

export default function SignupPage() {
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
        {/* ── Left: Branding / Benefits ── */}
        <div
          className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 20% 20%, rgba(139,92,246,0.12), transparent), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(99,102,241,0.08), transparent), #0A0F1E',
          }}
        >
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

          {/* Middle: headline + benefits */}
          <div className="relative">
            <h1 className="text-4xl font-bold text-white leading-tight mb-3">
              Ship video calls.
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #C084FC, #818CF8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                In minutes, not weeks.
              </span>
            </h1>
            <p className="text-slate-400 text-lg mb-10 max-w-md">
              Create your free account and start building real-time
              communication into your product today.
            </p>

            <div className="flex flex-col gap-3 max-w-md">
              {BENEFITS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(13,20,33,0.8)', border: '1px solid #1A2642' }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.15))',
                      border: '1px solid rgba(139,92,246,0.25)',
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

          {/* Bottom: trust */}
          <div className="relative flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 px-3 py-1.5 rounded-full border border-[#1A2642]">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
              Free plan, no credit card
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 px-3 py-1.5 rounded-full border border-[#1A2642]">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
              300 minutes / month free
            </span>
          </div>
        </div>

        {/* ── Right: Signup card ── */}
        <div
          className="relative flex items-center justify-center px-6 py-16"
          style={{ background: '#060B18' }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 50% 40% at 50% 20%, rgba(139,92,246,0.07), transparent)',
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
                <h2 className="text-lg font-bold text-white">Create your account</h2>
                <p className="text-sm text-slate-400">
                  Get started free — no credit card required.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <GoogleSignInButton />

                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1" style={{ height: '1px', background: '#1A2642' }} />
                  <span className="text-xs text-slate-600 uppercase tracking-widest">or</span>
                  <div className="flex-1" style={{ height: '1px', background: '#1A2642' }} />
                </div>

                <p className="text-center text-xs text-slate-500">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="font-medium text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

<p className="text-center text-xs text-slate-600 mt-6">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="hover:text-slate-300 transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="hover:text-slate-300 transition-colors">
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
