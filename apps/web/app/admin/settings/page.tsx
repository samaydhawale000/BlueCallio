'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

type SettingsData = {
  maintenanceMode: boolean;
  announcement: string | null;
};

export default function AdminSettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [maintenance, setMaintenance] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get('/admin/settings')
      .then((res) => {
        setData(res.data);
        setMaintenance(res.data.maintenanceMode);
        setAnnouncement(res.data.announcement || '');
      })
      .catch((e) => setError(e?.response?.data?.message || e?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    await api.patch('/admin/settings', { maintenanceMode: maintenance, announcement });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return <div className="text-slate-400 text-sm py-20 text-center">Loading settings…</div>;
  }

  if (error || !data) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
<header>
        <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage maintenance mode and announcements</p>
      </header>

      {/* Maintenance + announcement */}
      <div className="rounded-xl border border-[#1A2642] p-5" style={{ background: '#0D1421' }}>
        <p className="text-sm font-semibold text-white mb-4">Operations</p>
        <label className="flex items-center gap-3 mb-5 cursor-pointer">
          <input
            type="checkbox"
            checked={maintenance}
            onChange={(e) => setMaintenance(e.target.checked)}
            className="w-4 h-4 accent-indigo-500"
          />
          <span className="text-sm text-slate-300">Enable Maintenance Mode</span>
        </label>

        <label className="block mb-2 text-sm text-slate-300">Announcement</label>
        <textarea
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          placeholder="Broadcast a message to all users on the platform…"
          className="w-full rounded-lg border border-[#1A2642] bg-[#060B18] px-3 py-2.5 text-sm text-white placeholder:text-slate-600 resize-none"
          rows={3}
        />

        <button
          onClick={save}
          className="mt-4 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
        >
          {saved ? 'Saved ✓' : 'Save Settings'}
        </button>
      </div>

      {/* Server logs */}
      <div className="rounded-xl border border-[#1A2642] p-5" style={{ background: '#0D1421' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-white">Server Logs</p>
          <button
            onClick={() => window.alert('Log streaming is not wired up yet.')}
            className="text-[11px] px-3 py-1.5 rounded border border-[#1A2642] text-slate-300 hover:border-[#6366F1] transition-colors"
          >
            View logs
          </button>
        </div>
        <p className="text-xs text-slate-500">Access to realtime server logs coming soon.</p>
      </div>
    </div>
  );
}
