'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

type LiveCall = {
  id: string;
  type: 'AUDIO' | 'VIDEO';
  status: string;
  startedAt: string | null;
  createdAt: string;
  company: string;
  participants: number;
  duration: number;
};

export default function AdminCallsPage() {
  const [calls, setCalls] = useState<LiveCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get('/admin/calls')
      .then((res) => setCalls(res.data))
      .catch((e) => setError(e?.response?.data?.message || e?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const endCall = async (id: string) => {
    await api.patch(`/admin/calls/${id}/end`);
    load();
  };

  if (loading) {
    return <div className="text-slate-400 text-sm py-20 text-center">Loading live calls…</div>;
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Live Calls</h1>
        <p className="text-slate-400 text-sm mt-1">{calls.length} active calls</p>
      </header>

      <div className="rounded-xl border border-[#1A2642] overflow-hidden" style={{ background: '#0D1421' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A2642] text-left">
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-500">Call ID</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-500">Company</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-500">Participants</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-500">Type</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-500">Started At</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-500">Duration</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c) => (
                <tr key={c.id} className="border-b border-[#1A2642]/60 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{c.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-white font-medium">{c.company}</td>
                  <td className="px-4 py-3 text-slate-300">{c.participants}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-mono border ${
                        c.type === 'VIDEO'
                          ? 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      }`}
                    >
                      {c.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {c.startedAt ? new Date(c.startedAt).toLocaleTimeString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{Math.round(c.duration)} min</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => endCall(c.id)}
                      className="text-[11px] px-2.5 py-1 rounded border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      End Call
                    </button>
                  </td>
                </tr>
              ))}
              {calls.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    No active calls right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
