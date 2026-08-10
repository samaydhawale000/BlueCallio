'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Shield,
  Lock,
  LogOut,
  Check,
  Phone,
  Laptop,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

interface Me {
  userId: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'Singapore',
  'United Arab Emirates',
];

export default function SettingsPage() {
  const { token, user, logout, setUser } = useAuthStore();
  const router = useRouter();
  const { isReady } = useRequireAuth();

  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<string | null>(null);

  // Profile prefilled from the persisted store user (if available) so the
  // name/email show immediately, even before /auth/me responds.
  const [name, setName] = useState(user?.name ?? '');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [country, setCountry] = useState('India');

  const fetchMe = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      const data = res.data as Me;
      setMe(data);
      if (data.name) setName(data.name);
      // Keep the global store in sync so the avatar/name show everywhere.
      setUser({
        userId: data.userId,
        email: data.email ?? null,
        name: data.name ?? null,
        avatarUrl: data.avatarUrl ?? null,
      });
    } catch {
      logout();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [logout, router, setUser]);

  useEffect(() => {
    if (!isReady) return;
    if (!token) { router.push('/login'); return; }
    fetchMe();
  }, [isReady, token, fetchMe, router]);

  function saveProfile() {
    setSaved('profile');
    setTimeout(() => setSaved(null), 2200);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-indigo-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-slate-500">Loading settings…</span>
        </div>
      </div>
    );
  }

const avatar = me?.avatarUrl || user?.avatarUrl || '';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account and preferences.
        </p>
      </div>

      {/* ── Profile ── */}
      <section id="profile" className="rounded-2xl border border-[#1A2642] p-6" style={{ background: '#0D1421' }}>
        <div className="flex items-center gap-2 mb-1">
          <User size={16} style={{ color: '#818CF8' }} />
          <p className="text-base font-semibold text-white">Profile</p>
        </div>
        <p className="text-sm text-slate-500 mb-6">Basic account information.</p>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt="Profile"
              className="w-16 h-16 rounded-2xl object-cover shrink-0"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
            >
              {(name || 'U')[0].toUpperCase()}
            </div>
          )}
<div>
            <p className="text-sm font-medium text-white">{name || 'Your Account'}</p>
            <p className="text-xs text-slate-500">{me?.email ?? user?.email ?? me?.userId}</p>
          </div>
          <Badge variant="success" className="ml-auto">
            <Mail size={12} /> Google Verified
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
<Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
<Input
            label="Email Address"
            type="email"
            value={me?.email ?? user?.email ?? ''}
            disabled
            helper="Email is managed by your Google account."
          />
          <Input
            label="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Your company"
          />
          <Input
            label="Job Title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Your role"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-slate-100 bg-[#0D1421] border border-[#1A2642] outline-none focus:border-[#6366F1]/60"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <Button onClick={saveProfile}>
            {saved === 'profile' ? <><Check size={15} /> Saved</> : 'Save changes'}
          </Button>
        </div>
      </section>

      {/* ── Security ── */}
      <section id="security" className="rounded-2xl border border-[#1A2642] p-6" style={{ background: '#0D1421' }}>
        <div className="flex items-center gap-2 mb-1">
          <Shield size={16} style={{ color: '#34D399' }} />
          <p className="text-base font-semibold text-white">Security</p>
        </div>
        <p className="text-sm text-slate-500 mb-6">Authentication &amp; account security.</p>

        <div className="divide-y divide-[#1A2642] rounded-xl border border-[#1A2642]">
          <SettingRow
            icon={Shield}
            title="Google Account Connected"
            desc="Signed in with Google OAuth"
            right={<Badge variant="success">Connected</Badge>}
          />
          <SettingRow
            icon={Lock}
            title="Two-Factor Authentication"
            desc="Will be available soon"
            right={<Badge variant="default">Future</Badge>}
          />
        </div>

        <p className="text-sm font-semibold text-white mt-6 mb-3">Recent Login Sessions</p>
        <div className="divide-y divide-[#1A2642] rounded-xl border border-[#1A2642]">
          <SessionRow
            icon={Laptop}
            device="Chrome · macOS"
            location={country}
            time="Current session"
            active
          />
          <SessionRow
            icon={Phone}
            device="Google App · Android"
            location="New Delhi, India"
            time="2 days ago"
          />
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          <Button variant="secondary">
            <LogOut size={15} /> Sign Out of All Devices
          </Button>
        </div>
      </section>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  desc,
  right,
}: {
  icon: any;
  title: string;
  desc: string;
  right: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          <Icon size={16} style={{ color: '#818CF8' }} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
        </div>
      </div>
      {right}
    </div>
  );
}

function SessionRow({
  icon: Icon,
  device,
  location,
  time,
  active,
}: {
  icon: any;
  device: string;
  location: string;
  time: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: active ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', border: `1px solid ${active ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)'}` }}
        >
          <Icon size={16} style={{ color: active ? '#34D399' : '#818CF8' }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white">{device}</p>
            {active && <Badge variant="success">Active</Badge>}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{location} · {time}</p>
        </div>
      </div>
    </div>
  );
}
