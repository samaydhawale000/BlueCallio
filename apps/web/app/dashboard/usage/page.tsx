'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Gauge,
  PhoneCall,
  Video,
  Monitor,
  Clock,
  Wallet,
  ArrowUpRight,
  Receipt,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';

interface CurrentUsage {
  cycle: { start: string; end: string };
  usage: {
    audioMinutes: number;
    videoMinutes: number;
    screenShareMinutes: number;
    participants: number;
    callsCreated: number;
    callsCompleted: number;
  };
  freeAllowance: { audioMinutes: number; videoMinutes: number };
  rates: { audioPaise: number; videoPaise: number; screenSharePaise: number };
  cost: {
    audioPaise: number;
    videoPaise: number;
    screenSharePaise: number;
    totalPaise: number;
  };
  estimatedMonthEndPaise: number;
}

interface CallUse {
  id: string;
  callId: string;
  audioMinutes: number;
  videoMinutes: number;
  screenShareMinutes: number;
  participants: number;
  costPaise: number;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

interface ChartPoint {
  date: string;
  label: string;
  minutes: number;
  calls: number;
}

const paiseToINR = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

export default function UsagePage() {
  const { token, logout } = useAuthStore();
  const router = useRouter();
  const { isReady } = useRequireAuth();

  const [usage, setUsage] = useState<CurrentUsage | null>(null);
  const [callUsage, setCallUsage] = useState<CallUse[]>([]);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [usageRes, callRes, chartRes] = await Promise.all([
        api.get('/billing/current-usage'),
        api.get('/billing/call-usage'),
        api.get('/dashboard/usage/chart?days=14'),
      ]);
      setUsage(usageRes.data);
      setCallUsage(callRes.data ?? []);
      setChart(chartRes.data);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        logout();
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [logout, router]);

  useEffect(() => {
    if (!isReady) return;
    if (!token) { router.push('/login'); return; }
    fetchData();
  }, [isReady, token, fetchData, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-indigo-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-slate-500">Loading usage…</span>
        </div>
      </div>
    );
  }

const u = usage?.usage;
  const cost = usage?.cost;
  const free = usage?.freeAllowance;
  const rates = usage?.rates;
  const paiseToINRShort = (p: number) => `₹${(p / 100).toFixed(2)}`;
  const maxMin = Math.max(...chart.map((d) => d.minutes), 1);
  const totalCallsInChart = chart.reduce((acc, d) => acc + d.calls, 0);
  const totalBillableMinutes =
    (u?.audioMinutes ?? 0) + (u?.videoMinutes ?? 0) + (u?.screenShareMinutes ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Current Usage</h1>
        <p className="text-sm text-slate-500 mt-1">
          Pay only for what you use. Track minutes and cost by media type.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <UsageCard icon={Clock} label="Total Minutes" value={totalBillableMinutes} color="#8B5CF6" />
        <UsageCard icon={PhoneCall} label="Total Calls" value={u?.callsCompleted ?? 0} color="#6366F1" />
        <UsageCard icon={Wallet} label="Current Cost" value={paiseToINR(cost?.totalPaise ?? 0)} color="#10B981" />
        <UsageCard icon={Gauge} label="Est. Month-end" value={paiseToINR(usage?.estimatedMonthEndPaise ?? 0)} color="#F59E0B" />
      </div>

      {/* Per-type breakdown + cost */}
      <div
        className="rounded-2xl border border-[#2A3D64] p-6"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-sm font-semibold text-white">Usage by media type</p>
<p className="text-xs text-slate-500 mt-0.5">
              Free tier: {free?.audioMinutes ?? 500} audio + {free?.videoMinutes ?? 200} video min/month · screen share always paid
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-1 text-xs font-medium text-violet-300 hover:text-violet-200 transition-colors"
          >
            Billing &amp; Usage <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
<TypeRow
            icon={<PhoneCall size={16} style={{ color: '#818CF8' }} />}
            label="Audio"
            minutes={u?.audioMinutes ?? 0}
            costPaise={cost?.audioPaise ?? 0}
            freeOf={free?.audioMinutes ?? 0}
            rate={`${paiseToINRShort(rates?.audioPaise ?? 20)} / participant-min`}
          />
          <TypeRow
            icon={<Video size={16} style={{ color: '#C084FC' }} />}
            label="Video"
            minutes={u?.videoMinutes ?? 0}
            costPaise={cost?.videoPaise ?? 0}
            freeOf={free?.videoMinutes ?? 0}
            rate={`${paiseToINRShort(rates?.videoPaise ?? 80)} / participant-min`}
          />
          <TypeRow
            icon={<Monitor size={16} style={{ color: '#34D399' }} />}
            label="Screen Share"
            minutes={u?.screenShareMinutes ?? 0}
            costPaise={cost?.screenSharePaise ?? 0}
            freeOf={0}
            rate={`+${paiseToINRShort(rates?.screenSharePaise ?? 10)} / participant-min`}
          />
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-[#1A2642] p-6" style={{ background: '#0D1421' }}>
        <div className="flex flex-wrap items-center justify-between mb-6">
          <div>
            <p className="text-sm font-semibold text-white">Minutes — Last 14 Days</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {totalCallsInChart} calls in this period
            </p>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 h-48">
          {chart.map((d) => (
            <div key={d.date} className="flex flex-col items-center gap-2 flex-1 min-w-0">
              <span className="text-[10px] text-slate-500">{d.minutes > 0 ? d.minutes : ''}</span>
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${Math.max(4, (d.minutes / maxMin) * 100)}%`,
                  background: 'linear-gradient(180deg, #6366F1, rgba(99,102,241,0.25))',
                }}
                title={`${d.label}: ${d.minutes} minutes, ${d.calls} calls`}
              />
              <span className="text-[10px] text-slate-600">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Call analytics */}
      <div className="rounded-2xl border border-[#1A2642] p-6" style={{ background: '#0D1421' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-white">Call analytics</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Per-call usage and cost for this billing cycle.
            </p>
          </div>
          <span className="text-xs text-slate-500">{callUsage.length} calls</span>
        </div>

        {callUsage.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Receipt size={24} className="text-slate-600" />
            <p className="text-sm text-slate-500">No call usage recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-[#1A2642]">
                  <th className="py-2 pr-4 font-medium">Call</th>
                  <th className="py-2 pr-4 font-medium">Audio</th>
                  <th className="py-2 pr-4 font-medium">Video</th>
                  <th className="py-2 pr-4 font-medium">Screen</th>
                  <th className="py-2 pr-4 font-medium">Participants</th>
                  <th className="py-2 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {callUsage.map((c) => {
                  const totalMins = c.audioMinutes + c.videoMinutes + c.screenShareMinutes;
                  return (
                    <tr key={c.id} className="border-b border-[#1A2642]/60 last:border-0">
                      <td className="py-3 pr-4">
                        <p className="font-mono text-xs text-slate-400">{c.callId.slice(0, 12)}…</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          {c.startedAt ? new Date(c.startedAt).toLocaleDateString('en-IN') : '—'}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-slate-300">{Math.round(c.audioMinutes)} min</td>
                      <td className="py-3 pr-4 text-slate-300">{Math.round(c.videoMinutes)} min</td>
                      <td className="py-3 pr-4 text-slate-300">{Math.round(c.screenShareMinutes)} min</td>
                      <td className="py-3 pr-4 text-slate-300">{c.participants}</td>
                      <td className="py-3 font-medium text-white">{paiseToINR(c.costPaise)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#1A2642] p-5" style={{ background: '#0D1421' }}>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          <Gauge size={16} style={{ color: '#818CF8' }} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">How usage is billed</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Minutes are counted per participant from when a call connects until it ends. Anything
            beyond the free allowance is billed at {paiseToINRShort(rates?.audioPaise ?? 20)} (audio), {paiseToINRShort(rates?.videoPaise ?? 80)} (video), and +{paiseToINRShort(rates?.screenSharePaise ?? 10)}
            (screen share) per participant-minute. An invoice is generated and your card charged
            on the 1st of each month.
          </p>
        </div>
      </div>
    </div>
  );
}

function UsageCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <div className="rounded-2xl border border-[#1A2642] p-5" style={{ background: '#0D1421' }}>
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
        style={{ background: `${color}1A`, border: `1px solid ${color}33` }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function TypeRow({
  icon,
  label,
  minutes,
  costPaise,
  freeOf,
  rate,
}: {
  icon: React.ReactNode;
  label: string;
  minutes: number;
  costPaise: number;
  freeOf: number;
  rate: string;
}) {
  const pct =
    freeOf > 0 ? Math.min(100, Math.round((minutes / freeOf) * 100)) : Math.min(100, minutes > 0 ? 100 : 0);
  return (
    <div className="rounded-xl border border-[#1A2642] p-4" style={{ background: '#0A0F1E' }}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <p className="text-xs text-slate-500">{label}</p>
      </div>
      <p className="text-lg font-bold text-white">
        {Math.round(minutes).toLocaleString()}
        <span className="text-xs font-normal text-slate-500"> min</span>
      </p>
      <p className="text-xs font-semibold mt-1 text-violet-300">{paiseToINR(costPaise)}</p>
      <p className="text-[11px] text-slate-600 mt-0.5">{rate}</p>
      {freeOf > 0 && (
        <div className="mt-2.5">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
            <span>Free allowance: {freeOf} min</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1A2642' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: pct >= 90 ? 'linear-gradient(135deg,#f43f5e,#fb7185)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
