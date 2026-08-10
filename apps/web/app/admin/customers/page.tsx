'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

type Customer = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  plan: string;
  status: string;
  role: string;
  createdAt: string;
  lastActiveAt: string | null;
  projectCount: number;
  minutesUsed: number;
  projects: {
    id: string;
    name: string;
    apiKeys: number;
    calls: number;
  }[];
};

const PLANS = ['FREE', 'STARTER', 'GROWTH', 'PRO', 'ENTERPRISE'];

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get('/admin/customers')
      .then((res) => setCustomers(res.data))
      .catch((e) => setError(e?.response?.data?.message || e?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleStatus = async (c: Customer) => {
    const next = c.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    await api.patch(`/admin/customers/${c.id}/status`, { status: next });
    load();
  };

  const changePlan = async (c: Customer, plan: string) => {
    await api.patch(`/admin/customers/${c.id}/plan`, { plan });
    load();
  };

  if (loading) {
    return <div className="text-slate-400 text-sm py-20 text-center">Loading customers…</div>;
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
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <p className="text-slate-400 text-sm mt-1">{customers.length} registered companies</p>
      </header>

      <div className="rounded-xl border border-[#1A2642] overflow-hidden" style={{ background: '#0D1421' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A2642] text-left">
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-500">Company</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-500">Owner</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-500">Plan</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-500">Projects</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-500">Minutes Used</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-500">Last Active</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-500">Status</th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-[#1A2642]/60 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {c.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.avatarUrl} alt={c.name || ''} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                        >
                          {(c.name || c.email || 'C')[0].toUpperCase()}
                        </div>
                      )}
                      <span className="text-white font-medium">{c.name || 'Unnamed'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{c.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={c.plan}
                      onChange={(e) => changePlan(c, e.target.value)}
                      className="bg-[#060B18] border border-[#1A2642] rounded px-2 py-1 text-xs text-slate-300"
                    >
                      {PLANS.map((p) => (
                        <option key={p} value={p}>
                          {p.charAt(0) + p.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{c.projectCount}</td>
                  <td className="px-4 py-3 text-slate-300">{c.minutesUsed}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {c.lastActiveAt ? new Date(c.lastActiveAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleStatus(c)}
                        className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${
                          c.status === 'ACTIVE'
                            ? 'border-red-500/40 text-red-400 hover:bg-red-500/10'
                            : 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                      >
                        {c.status === 'ACTIVE' ? 'Suspend' : 'Resume'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    No customers yet.
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
