'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

type AuditLog = {
  id: string;
  action: string;
  actor: string;
  metadata: any;
  createdAt: string;
};

const ACTION_COLORS: Record<string, string> = {
  USER_REGISTERED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  PROJECT_CREATED: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  API_KEY_GENERATED: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  PLAN_CHANGED: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  ACCOUNT_SUSPENDED: 'bg-red-500/10 text-red-400 border-red-500/30',
  ACCOUNT_RESUMED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/audit-logs')
      .then((res) => setLogs(res.data))
      .catch((e) => setError(e?.response?.data?.message || e?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-slate-400 text-sm py-20 text-center">Loading audit logs…</div>;
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
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <p className="text-slate-400 text-sm mt-1">Recent platform activity</p>
      </header>

      <div className="rounded-xl border border-[#1A2642] overflow-hidden" style={{ background: '#0D1421' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A2642] text-left">
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-500">Action</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-500">Actor</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-500">Details</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-500">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-[#1A2642]/60 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-mono border ${
                        ACTION_COLORS[l.action] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                      }`}
                    >
                      {l.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{l.actor}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                    {l.metadata ? JSON.stringify(l.metadata) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    No audit logs yet.
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
