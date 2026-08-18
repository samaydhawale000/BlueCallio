'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';

type OverviewData = {
  stats: {
    totalCompanies: number;
    freeUsers: number;
    paidUsers: number;
    totalProjects: number;
    activeCalls: number;
    activeParticipants: number;
    minutesToday: number;
    minutesMonth: number;
    participantMinutesMonth: number;
    billableRevenuePaise: number;
  };
  charts: {
    calls: { label: string; value: number }[];
    minutes: { label: string; value: number }[];
    newUsers: { label: string; value: number }[];
  };
};

const paiseToINR = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

// "Platform minutes" (call wall-clock duration) and "participant-minutes"
// (the actual billing basis) are deliberately shown as separate cards —
// mixing them makes the numbers on this page disagree with what customers
// are actually billed.
const STAT_CARDS = (s: OverviewData['stats']) => [
  { label: 'Total Companies', value: s.totalCompanies, icon: '🏢' },
  { label: 'Free Users', value: s.freeUsers, icon: '🟢' },
  { label: 'Paid Users', value: s.paidUsers, icon: '💳' },
  { label: 'Total Projects', value: s.totalProjects, icon: '📁' },
  { label: 'Active Calls', value: s.activeCalls, icon: '📞' },
  { label: 'Active Participants', value: s.activeParticipants, icon: '👥' },
  { label: 'Platform Minutes Today', value: s.minutesToday, icon: '⏱️' },
  { label: 'Platform Minutes This Month', value: s.minutesMonth, icon: '📅' },
  { label: 'Participant-Minutes This Month', value: Math.round(s.participantMinutesMonth), icon: '📊' },
  { label: 'Billable Revenue This Month', value: paiseToINR(s.billableRevenuePaise), icon: '💰' },
];

function BarChart({
  data,
  color = '#6366F1',
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end justify-between gap-1.5 h-44">
      {data.map((d) => (
        <div
          key={d.label}
          className="flex-1 flex flex-col items-center gap-1 h-full min-w-0"
        >
          <div className="flex-1 flex items-end w-full justify-center">
            <div
              className="w-full max-w-[28px] rounded-t"
              style={{
                height: `${Math.max(6, (d.value / max) * 100)}%`,
                background: color,
                opacity: 0.85,
              }}
            />
          </div>
          <div className="text-[10px] text-slate-600 truncate max-w-full text-center">
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/overview')
      .then((res) => setData(res.data))
      .catch((e) => setError(e?.response?.data?.message || e?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-slate-400 text-sm py-20 text-center">Loading overview…</div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-400 text-sm mb-3">{error}</p>
        <p className="text-slate-500 text-xs">Admin access required.</p>
      </div>
    );
  }

  const stats = data!.stats;
  const charts = data!.charts;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] font-mono uppercase tracking-widest text-slate-500 mb-1">
          Internal Dashboard
        </p>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-slate-400 text-sm mt-1">
          Is BlueJoinet healthy right now?
        </p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {STAT_CARDS(stats).map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-[#1A2642] p-4"
            style={{ background: '#0D1421' }}
          >
            <div className="text-xl mb-2">{c.icon}</div>
            <div className="text-2xl font-bold text-white">{c.value}</div>
            <div className="text-xs text-slate-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#1A2642] p-5" style={{ background: '#0D1421' }}>
          <p className="text-sm font-semibold text-white mb-4">Calls (7d)</p>
          <BarChart data={charts.calls} color="#6366F1" />
        </div>
        <div className="rounded-xl border border-[#1A2642] p-5" style={{ background: '#0D1421' }}>
          <p className="text-sm font-semibold text-white mb-4">Minutes (7d)</p>
          <BarChart data={charts.minutes} color="#8B5CF6" />
        </div>
        <div className="rounded-xl border border-[#1A2642] p-5" style={{ background: '#0D1421' }}>
          <p className="text-sm font-semibold text-white mb-4">New Users (30d)</p>
          <BarChart data={charts.newUsers} color="#10B981" />
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: '/admin/customers', label: 'Customers', icon: '👥' },
          { href: '/admin/calls', label: 'Live Calls', icon: '📞' },
          { href: '/admin/health', label: 'System Health', icon: '🩺' },
          { href: '/admin/audit-logs', label: 'Audit Logs', icon: '📝' },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-xl border border-[#1A2642] p-5 text-center hover:border-[#2A3D64] transition-all"
            style={{ background: '#0D1421' }}
          >
            <div className="text-2xl mb-2">{l.icon}</div>
            <p className="text-sm font-medium text-white">{l.label}</p>
            <p className="text-xs text-slate-500 mt-1">View →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
