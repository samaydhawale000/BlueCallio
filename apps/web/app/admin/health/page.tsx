'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Bell, CircleAlert, CircleCheck, Database, RefreshCw } from 'lucide-react';

type HealthData = {
  node: { status: string; uptime: number };
  database: { status: string };
  turn: { status: string; configured: boolean; credentialGeneration: string };
  websocket: { clients: number; inCall?: number; rooms?: number };
  memory: { usage: number; total: number };
};

type Alert = {
  id: string;
  type: string;
  severity: string;
  message: string;
};

export default function AdminHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    Promise.all([api.get('/admin/health'), api.get('/admin/alerts')])
      .then(([h, a]) => {
        setHealth(h.data);
        setAlerts(a.data);
      })
      .catch((e) => setError(e?.response?.data?.message || e?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) {
    return <div className="text-slate-400 text-sm py-20 text-center">Loading health…</div>;
  }

  if (error || !health) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  const components = [
    { name: 'Node Server', status: health.node.status, icon: CircleCheck },
    { name: 'Database', status: health.database.status, icon: Database },
    {
      name: 'TURN Server',
      status: health.turn.status,
      icon: RefreshCw,
      detail: health.turn.configured
        ? `Credential generation: ${health.turn.credentialGeneration}`
        : 'Not configured',
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">System Health</h1>
        <p className="text-slate-400 text-sm mt-1">Live infrastructure status</p>
      </header>

      {/* Alerts */}
      <div className="rounded-xl border border-[#1A2642] p-5" style={{ background: '#0D1421' }}>
        <p className="flex items-center gap-2 text-sm font-semibold text-white mb-3"><Bell size={16} /> Alerts</p>
        {alerts.length === 0 ? (
          <p className="text-sm text-emerald-400">All systems operational. No active alerts.</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-sm text-amber-400">
                <CircleAlert size={16} />
                <span>{a.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Components */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {components.map((c) => (
          <div key={c.name} className="rounded-xl border border-[#1A2642] p-5" style={{ background: '#0D1421' }}>
            <div className="mb-2 text-indigo-300"><c.icon size={22} /></div>
            <p className="text-white font-medium">{c.name}</p>
            <span
              className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${
                c.status === 'healthy'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border-red-500/30'
              }`}
            >
              {c.status}
            </span>
            {c.detail && <p className="text-[11px] text-slate-500 mt-1.5">{c.detail}</p>}
          </div>
        ))}
      </div>

      {/* Metrics — CPU/network intentionally omitted here; process.cpuUsage()
          isn't a real utilization percentage, so it's tracked at the VPS
          monitoring layer instead of shown as a misleading number. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Node Uptime" value={`${Math.round(health.node.uptime / 60)} min`} />
        <MetricCard label="Memory" value={`${health.memory.usage} / ${health.memory.total} MB`} />
        <MetricCard label="WebSocket Clients" value={String(health.websocket.clients)} />
        <MetricCard label="Participants In Call" value={String(health.websocket.inCall ?? 0)} />
        <MetricCard label="Active Call Rooms" value={String(health.websocket.rooms ?? 0)} />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#1A2642] p-5" style={{ background: '#0D1421' }}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}
