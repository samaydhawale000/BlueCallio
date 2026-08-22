'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Pagination } from '../../components/ui/Pagination';

type Customer = { id: string; name: string | null; email: string; plan: string; status: string; lastActiveAt: string | null; projectCount: number; minutesUsed: number };
type Plan = { slug: string; name: string };

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]); const [plans, setPlans] = useState<Plan[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(10); const [total, setTotal] = useState(0); const [pageCount, setPageCount] = useState(1);
  const load = () => { setLoading(true); api.get(`/admin/customers?page=${page}`).then((res) => { setCustomers(res.data.data ?? []); setTotal(res.data.total ?? 0); setPageCount(res.data.pageCount ?? 1); setPageSize(res.data.pageSize ?? 10); }).catch((e) => setError(e?.response?.data?.message || e?.message || 'Failed to load')).finally(() => setLoading(false)); };
  useEffect(load, [page]);
  useEffect(() => { api.get('/billing/plans').then((res) => setPlans(res.data ?? [])).catch(() => setPlans([])); }, []);
  const update = async (id: string, path: string, body: object) => { await api.patch(`/admin/customers/${id}/${path}`, body); load(); };
  if (loading) return <div className="text-slate-400 text-sm py-20 text-center">Loading customers…</div>;
  if (error) return <div className="py-20 text-center"><p className="text-red-400 text-sm">{error}</p></div>;
  return <div className="space-y-6"><header><h1 className="text-2xl font-bold text-white">Customers</h1><p className="text-slate-400 text-sm mt-1">{total} registered companies</p></header>
    <div className="rounded-xl border border-[#1A2642] overflow-hidden" style={{ background: '#0D1421' }}><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-[#1A2642] text-left">{['Company', 'Owner', 'Plan', 'Projects', 'Minutes Used', 'Last Active', 'Status', 'Actions'].map((label) => <th key={label} className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-500">{label}</th>)}</tr></thead><tbody>{customers.map((c) => <tr key={c.id} className="border-b border-[#1A2642]/60"><td className="px-4 py-3 text-white font-medium">{c.name || 'Unnamed'}</td><td className="px-4 py-3 text-slate-400">{c.email}</td><td className="px-4 py-3"><select value={c.plan} onChange={(e) => update(c.id, 'plan', { plan: e.target.value })} className="bg-[#060B18] border border-[#1A2642] rounded px-2 py-1 text-xs text-slate-300">{plans.map((plan) => <option key={plan.slug} value={plan.slug}>{plan.name}</option>)}</select></td><td className="px-4 py-3 text-slate-300">{c.projectCount}</td><td className="px-4 py-3 text-slate-300">{c.minutesUsed}</td><td className="px-4 py-3 text-slate-400">{c.lastActiveAt ? new Date(c.lastActiveAt).toLocaleDateString() : '—'}</td><td className="px-4 py-3 text-slate-300">{c.status}</td><td className="px-4 py-3"><button onClick={() => update(c.id, 'status', { status: c.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' })} className="text-[11px] px-2.5 py-1 rounded border border-red-500/40 text-red-400">{c.status === 'ACTIVE' ? 'Suspend' : 'Resume'}</button></td></tr>)}{customers.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No customers yet.</td></tr>}</tbody></table></div><div className="px-4 pb-4"><Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={pageSize} onPageChange={setPage} /></div></div>
  </div>;
}
