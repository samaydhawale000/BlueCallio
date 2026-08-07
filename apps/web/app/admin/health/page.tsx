'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

type HealthData = {
  node: { status: string; uptime: number };
  database: { status: string };
  turn: { status: string };
  websocket: { clients: number };
  cpu: { usage: number };
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
    { name: 'Node Server', status: health.node.status, icon: '🟢' },
    { name: 'Database', status: health.database.status, icon: '🛢️' },
    { name: 'TURN Server', status: health.turn.status, icon: '🔄' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">System Health</h1>
        <p className="text-slate-400 text-sm mt-1">Live infrastructure status</p>
      </header>

      {/* Alerts */}
      <div className="rounded-xl border border-[#1A2642] p-5" style={{ background: '#0D1421' }}>
        <p className="text-sm font-semibold text-white mb-3">🔔 Alerts</p>
        {alerts.length === 0 ? (
          <p className="text-sm text-emerald-400">All systems operational. No active alerts.</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-sm text-amber-400">
                <span>⚠️</span>
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
            <div className="text-2xl mb-2">{c.icon}</div>
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
          </div>
        ))}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="CPU Usage" value={`${health.cpu.usage}%`} />
        <MetricCard label="Memory" value={`${health.memory.usage} / ${health.memory.total} MB`} />
        <MetricCard label="WebSocket Clients" value={String(health.websocket.clients)} />
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
