'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  KeyRound,
  PhoneCall,
  Play,
  Gauge,
  CreditCard,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import logo from '../assets/images/logo.png';

/** Loose E.164 check (+ up to 15 digits) — what Razorpay requires for a contact number. */
const isValidPhone = (value: string) => /^\+[1-9]\d{7,14}$/.test(value.trim());

/**
 * Blocks the dashboard until the user has a contact phone number on file.
 * Collected once here (not re-asked when adding a card) because Razorpay
 * requires a contact number on the payment-provider customer before it will
 * authorise a recurring card mandate for auto-billing.
 */
function PhoneGate() {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const [phone, setPhone] = useState('+91');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(phone)) {
      setError('Enter a valid phone number with country code, e.g. +919876543210.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await api.post('/auth/phone', { phone: phone.trim() });
      if (user) setUser({ ...user, phone: phone.trim() });
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not save your phone number.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#060B18' }}>
      <div
        className="w-full max-w-sm rounded-2xl border border-[#1A2642] p-8"
        style={{ background: '#0D1421', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}
      >
        <p className="text-lg font-bold text-white mb-1">One more thing</p>
        <p className="text-sm text-slate-400 mb-6">
          Add a contact number to your account. It&apos;s required to authorise cards for
          automatic monthly billing later on.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+919876543210"
            className="w-full rounded-lg border border-[#1A2642] px-3 py-2.5 text-sm text-slate-200"
            style={{ background: '#0A0F1E' }}
            autoFocus
          />
          {error && <p className="text-xs" style={{ color: '#F87171' }}>{error}</p>}
          <Button type="submit" loading={saving} className="w-full justify-center">
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { label: 'API Keys', href: '/dashboard/api-keys', icon: KeyRound },
  { label: 'Calls', href: '/dashboard/calls', icon: PhoneCall },
  { label: 'Playground', href: '/dashboard/playground', icon: Play },
  { label: 'Usage', href: '/dashboard/usage', icon: Gauge },
  { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { label: 'Documentation', href: '/docs', icon: BookOpen },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();
  const { isReady } = useRequireAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName = user?.name || user?.email || 'Account';
  const avatarUrl = user?.avatarUrl || '';

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isReady && user && !user.phone) {
    return <PhoneGate />;
  }

  return (
    <div className="min-h-screen lg:flex" style={{ background: '#060B18' }}>
      {/* Mobile top bar */}
      <div
        className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-[#1A2642]"
        style={{ background: '#0A0F1E' }}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
          >
            <Image src={logo} alt="BlueJoinet" width={28} height={28} className="h-6 w-6 object-contain" />
          </span>
          <span className="font-mono font-bold text-white tracking-tight">
            BlueJoinet
          </span>
        </Link>
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#1A2642] text-slate-400"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed on mobile (drawer), sticky on desktop */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300
          border-r border-[#1A2642] flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:sticky lg:top-0 lg:h-screen lg:flex-none lg:w-64
        `}
        style={{ background: '#0A0F1E' }}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-[#1A2642]">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
            >
              <Image src={logo} alt="BlueJoinet" width={32} height={32} className="h-7 w-7 object-contain" />
            </span>
            <span className="font-mono font-bold text-white tracking-tight">
              BlueJoinet
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 flex items-center justify-center text-slate-400"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="px-3 pb-2 text-[11px] font-mono uppercase tracking-widest text-slate-600">
            Workspace
          </p>
          <div className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== '/dashboard' &&
                  pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                    ${
                      active
                        ? 'text-white font-medium'
                        : 'text-slate-400 hover:text-white'
                    }
                  `}
                  style={
                    active
                      ? {
                          background:
                            'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
                          border: '1px solid rgba(99,102,241,0.25)',
                        }
                      : undefined
                  }
                >
                  <Icon size={17} style={{ color: active ? '#A5B4FC' : undefined }} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User + logout */}
        <div className="p-3 border-t border-[#1A2642]">
<div className="flex items-center gap-3 px-3 py-2">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                {(displayName || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email ?? 'Starter Plan'}</p>
            </div>
            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
