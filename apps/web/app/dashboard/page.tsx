'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  KeyRound,
  Play,
  BookOpen,
  Video,
  Phone,
  Monitor,
ArrowUpRight,
  Sparkles,
  Wallet,
  Code2,
  Layout as LayoutIcon,
  Server,
  FolderKanban,
  PhoneCall,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  webhookUrl: string | null;
  webhookSecret: string | null;
  createdAt: string;
}

interface Call {
  id: string;
  projectId: string;
  callerId: string;
  receiverId: string;
  type: 'AUDIO' | 'VIDEO';
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  project?: { id: string; name: string };
}

interface Usage {
  totalCalls: number;
  activeCalls: number;
  minutesUsed: number;
}

interface CurrentUsage {
  usage: {
    audioMinutes: number;
    videoMinutes: number;
    screenShareMinutes: number;
    participants: number;
  };
  freeAllowance: { audioMinutes: number; videoMinutes: number };
  cost: {
    audioPaise: number;
    videoPaise: number;
    screenSharePaise: number;
    totalPaise: number;
  };
estimatedMonthEndPaise: number;
  isFreeTier?: boolean;
  hasPaymentMethod?: boolean;
  freeUsagePercent?: number;
}

const paiseToINR = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

const QUICK_ACTIONS = [
  { label: 'Create Project', icon: Plus, href: '#', color: '#6366F1' },
  { label: 'Generate API Key', icon: KeyRound, href: '#', color: '#8B5CF6' },
  { label: 'Open Playground', icon: Play, href: '/dashboard/playground', color: '#10B981' },
  { label: 'Documentation', icon: BookOpen, href: '/docs', color: '#F59E0B' },
];

const RESOURCES = [
  { label: 'Quick Start', icon: Sparkles, href: '/docs' },
  { label: 'React SDK', icon: Code2, href: '/docs' },
  { label: 'Hosted UI', icon: LayoutIcon, href: '/docs' },
  { label: 'REST API', icon: Server, href: '/docs' },
];

interface ChartPoint {
  label: string;
  minutes: number;
  calls: number;
}

export default function DashboardPage() {
  const { token, logout } = useAuthStore();
  const router = useRouter();
  const { isReady } = useRequireAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectKeys, setProjectKeys] = useState<Record<string, ApiKey[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);

  const [copied, setCopied] = useState<string | null>(null);

const [calls, setCalls] = useState<Call[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [currentUsage, setCurrentUsage] = useState<CurrentUsage | null>(null);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [userName, setUserName] = useState('there');

  const [webhookInputs, setWebhookInputs] = useState<Record<string, string>>({});
  const [savingWebhook, setSavingWebhook] = useState<string | null>(null);
  const [webhookSaved, setWebhookSaved] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
      const inputs: Record<string, string> = {};
      for (const p of res.data) inputs[p.id] = p.webhookUrl ?? '';
      setWebhookInputs(inputs);
    } catch {
      logout();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [logout, router]);

const fetchDashboardData = useCallback(async () => {
    try {
      const [callsRes, usageRes, currentRes, chartRes, meRes] = await Promise.all([
        api.get('/dashboard/calls'),
        api.get('/dashboard/usage'),
        api.get('/billing/current-usage'),
        api.get('/dashboard/usage/chart?days=7'),
        api.get('/auth/me'),
      ]);
      setCalls(callsRes.data);
      setUsage(usageRes.data);
      setCurrentUsage(currentRes.data);
      setChart(chartRes.data ?? []);
      setUserName(meRes.data?.name || meRes.data?.email?.split('@')[0] || 'there');
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (!token) { router.push('/login'); return; }
    fetchProjects();
    fetchDashboardData();
  }, [isReady, token, fetchProjects, fetchDashboardData, router]);

  const fetchKeys = useCallback(async (projectId: string) => {
    if (projectKeys[projectId]) return;
    const res = await api.get(`/api-keys/${projectId}`);
    setProjectKeys((prev) => ({ ...prev, [projectId]: res.data }));
  }, [projectKeys]);

  async function toggleProject(id: string) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    await fetchKeys(id);
  }

  async function createProject() {
    if (!newProjectName.trim()) return;
    setCreatingProject(true);
    try {
      const res = await api.post('/projects', { name: newProjectName.trim() });
      setProjects((prev) => [res.data, ...prev]);
      setWebhookInputs((prev) => ({ ...prev, [res.data.id]: '' }));
      setNewProjectName('');
      setShowNewProject(false);
    } finally { setCreatingProject(false); }
  }

  async function createKey(projectId: string) {
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const res = await api.post('/api-keys', { projectId, name: newKeyName.trim() });
      setProjectKeys((prev) => ({ ...prev, [projectId]: [res.data, ...(prev[projectId] ?? [])] }));
      setNewKeyName('');
      setShowNewKey(null);
    } finally { setCreatingKey(false); }
  }

  async function saveWebhook(projectId: string) {
    setSavingWebhook(projectId);
    try {
      const url = webhookInputs[projectId]?.trim() || null;
      const res = await api.patch(`/projects/${projectId}/webhook`, { webhookUrl: url });
      setProjects((prev) =>
        prev.map((p) => p.id === projectId ? { ...p, webhookUrl: res.data.webhookUrl, webhookSecret: res.data.webhookSecret } : p)
      );
      setWebhookSaved(projectId);
      setTimeout(() => setWebhookSaved(null), 2500);
    } finally { setSavingWebhook(null); }
  }

  async function copyKey(id: string, key: string) {
    await navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

const minutesUsed = usage?.minutesUsed ?? 0;
  const totalKeys = Object.values(projectKeys).flat().length;
  const weekData = chart.length > 0 ? chart : [];
  const maxWeek = Math.max(...weekData.map((d) => d.minutes), 1);

  const recentActivity = calls.slice(0, 5).map((call) => {
    const statusText =
      call.status === 'ACCEPTED'
        ? `Call ${call.type === 'VIDEO' ? 'video' : 'audio'} completed`
        : call.status === 'RINGING' || call.status === 'INITIATED'
          ? `Call ${call.type === 'VIDEO' ? 'video' : 'audio'} started`
          : call.status === 'REJECTED'
            ? `Call ${call.type === 'VIDEO' ? 'video' : 'audio'} rejected`
            : call.status === 'MISSED'
              ? `Call ${call.type === 'VIDEO' ? 'video' : 'audio'} missed`
              : `Call ${call.type === 'VIDEO' ? 'video' : 'audio'} ${(call.status || '').toLowerCase()}`;
    return {
      id: call.id,
      text: statusText,
      time: relativeTime(call.createdAt),
      color: call.status === 'ACCEPTED' ? '#10B981' : call.status === 'RINGING' || call.status === 'INITIATED' ? '#F59E0B' : '#F87171',
    };
  });
  const audioMins = currentUsage?.usage?.audioMinutes ?? 0;
  const videoMins = currentUsage?.usage?.videoMinutes ?? 0;
  const screenMins = currentUsage?.usage?.screenShareMinutes ?? 0;
  const totalBillable = audioMins + videoMins + screenMins;
  const currentCost = currentUsage?.cost?.totalPaise ?? 0;
  const monthEndCost = currentUsage?.estimatedMonthEndPaise ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-indigo-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-slate-500">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ── Header row ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
<h1 className="text-2xl font-bold text-white">
            Welcome back, <span className="gradient-text-hero capitalize">{userName}</span> 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Your communication platform at a glance.
          </p>
        </div>
        <Button onClick={() => { setShowNewProject(true); setNewProjectName(''); }}>
          <Plus size={16} className="mr-1.5" /> Create Project
        </Button>
      </div>

      {/* ── Plan card + usage ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
{/* Plan / usage */}
        <div
          className="lg:col-span-2 rounded-2xl border border-[#1A2642] p-6"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))', borderColor: '#2A3D64' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-white">Free Tier</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Pay only for what you use · {currentUsage?.freeAllowance?.audioMinutes ?? 500} audio + {currentUsage?.freeAllowance?.videoMinutes ?? 200} video mins free
              </p>
            </div>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-1 text-xs font-medium text-violet-300 hover:text-violet-200 transition-colors"
            >
              Billing &amp; Usage <ArrowUpRight size={14} />
            </Link>
          </div>

{/* Per-type summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <MiniType label="Audio" mins={audioMins} costPaise={currentUsage?.cost?.audioPaise ?? 0} showCost={!currentUsage?.isFreeTier} />
            <MiniType label="Video" mins={videoMins} costPaise={currentUsage?.cost?.videoPaise ?? 0} showCost={!currentUsage?.isFreeTier} />
            <MiniType label="Screen Share" mins={screenMins} costPaise={currentUsage?.cost?.screenSharePaise ?? 0} showCost={!currentUsage?.isFreeTier} />
          </div>

          <div className="flex flex-wrap items-center justify-between mt-2 gap-3">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-slate-500">Total minutes</p>
                <p className="text-lg font-bold text-white">{totalBillable.toLocaleString()}</p>
              </div>
              {!currentUsage?.isFreeTier && (
                <>
                  <div>
                    <p className="text-xs text-slate-500">Current cost</p>
                    <p className="text-lg font-bold" style={{ color: '#34D399' }}>{paiseToINR(currentCost)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Est. month-end</p>
                    <p className="text-lg font-bold text-white">{paiseToINR(monthEndCost)}</p>
                  </div>
                </>
              )}
            </div>
            <div
              className="text-xs font-mono px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34D399' }}
            >
              {usage?.activeCalls ?? 0} Active Calls
            </div>
          </div>
        </div>

        {/* Usage chart */}
        <div
          className="rounded-2xl border border-[#1A2642] p-6"
          style={{ background: '#0D1421' }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-white">Minutes this week</p>
            <span className="text-xs text-slate-500">{minutesUsed.toLocaleString()} total</span>
          </div>
<div className="flex items-end justify-between gap-2 h-32">
            {weekData.length === 0 ? (
              <div className="w-full flex items-center justify-center h-full text-xs text-slate-600">
                No usage this week yet
              </div>
            ) : (
              weekData.map((d) => (
                <div key={d.label} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${Math.max(8, (d.minutes / maxWeek) * 100)}%`,
                      background: 'linear-gradient(180deg, #6366F1, rgba(99,102,241,0.3))',
                    }}
                  />
                  <span className="text-[10px] text-slate-600">{d.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="Projects" value={projects.length} color="#6366F1" />
        <StatCard label="Active Calls" value={usage?.activeCalls ?? 0} color="#10B981" />
        <StatCard label="Calls" value={usage?.totalCalls ?? 0} color="#F59E0B" />
        <StatCard label="Minutes" value={usage?.minutesUsed ?? 0} color="#8B5CF6" />
        <StatCard label="API Keys" value={totalKeys} color="#EC4899" />
      </div>

      {/* ── Recent Calls + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent calls */}
        <div
          className="lg:col-span-2 rounded-2xl border border-[#1A2642]"
          style={{ background: '#0D1421' }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2642]">
            <p className="font-semibold text-white">Recent Calls</p>
            <Link
              href="/dashboard/calls"
              className="inline-flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200 transition-colors"
            >
              View all <ArrowUpRight size={13} />
            </Link>
          </div>

          {calls.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-medium text-white mb-1">No calls yet</p>
              <p className="text-sm text-slate-500 mb-5">
                Create your first communication session.
              </p>
              <div className="flex flex-col items-center gap-3">
                <Link
                  href="/dashboard/playground"
                  className="inline-flex items-center gap-2 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                >
                  <Play size={15} /> Open Playground
                </Link>
                <span className="text-xs text-slate-600">or</span>
                <Link href="/docs" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  Read Quick Start documentation
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#1A2642]">
              {calls.slice(0, 5).map((call) => (
                <button
                  key={call.id}
                  onClick={() => setSelectedCall(call)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: call.type === 'VIDEO'
                          ? 'rgba(139,92,246,0.12)'
                          : 'rgba(99,102,241,0.12)',
                        border: `1px solid ${call.type === 'VIDEO' ? 'rgba(139,92,246,0.25)' : 'rgba(99,102,241,0.25)'}`,
                      }}
                    >
                      {call.type === 'VIDEO'
                        ? <Video size={16} style={{ color: '#C084FC' }} />
                        : <Phone size={16} style={{ color: '#818CF8' }} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">
                          {call.type === 'VIDEO' ? 'Video Call' : 'Voice Call'}
                        </p>
                        <Badge variant={statusBadge(call.status)}>{statusLabel(call.status)}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {relativeTime(call.createdAt)}
                        {call.project?.name ? ` · ${call.project.name}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-500 shrink-0">
                    {callDuration(call)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div
          className="rounded-2xl border border-[#1A2642] p-6"
          style={{ background: '#0D1421' }}
        >
          <p className="font-semibold text-white mb-4">Quick Actions</p>
          <div className="flex flex-col gap-2.5">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                onClick={(e) => {
                  if (action.href === '#') {
                    e.preventDefault();
                    setShowNewProject(true);
                  }
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#1A2642] hover:border-[#2A3D64] transition-colors"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${action.color}1A`, border: `1px solid ${action.color}33` }}
                >
                  <action.icon size={16} style={{ color: action.color }} />
                </div>
                <span className="text-sm text-slate-300">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Projects + Developer Resources ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Projects */}
        <div
          className="lg:col-span-2 rounded-2xl border border-[#1A2642]"
          style={{ background: '#0D1421' }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2642]">
            <p className="font-semibold text-white">Projects</p>
            <Button variant="secondary" size="sm" onClick={() => { setShowNewProject(true); setNewProjectName(''); }}>
              <Plus size={14} className="mr-1" /> New Project
            </Button>
          </div>

          {showNewProject && (
            <div className="px-6 py-4 border-b border-[#1A2642] flex gap-3">
              <Input
                placeholder="Project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createProject()}
                autoFocus
                className="flex-1"
              />
              <Button onClick={createProject} loading={creatingProject} size="sm">Create</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowNewProject(false)}>Cancel</Button>
            </div>
          )}

          {projects.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
              >
                <FolderKanban size={20} style={{ color: '#818CF8' }} />
              </div>
              <p className="text-sm font-medium text-white mb-1">No projects yet</p>
              <p className="text-sm text-slate-500 mb-5">
                Create a project to get your first API key.
              </p>
              <Button onClick={() => { setShowNewProject(true); setNewProjectName(''); }}>
                <Plus size={15} className="mr-1.5" /> Create Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-xl border border-[#1A2642] p-5 hover:border-[#2A3D64] transition-colors"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                    >
                      {project.name[0].toUpperCase()}
                    </div>
                    <Badge variant="purple">Production</Badge>
                  </div>
                  <p className="text-sm font-semibold text-white mb-0.5">{project.name}</p>
                  <p className="text-xs text-slate-500 mb-4">
                    {projectKeys[project.id]?.length ?? 0} API Keys · Created{' '}
                    {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <button
                    onClick={() => toggleProject(project.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-violet-300 hover:text-violet-200 transition-colors"
                  >
                    {expandedId === project.id ? 'Hide details' : 'View'} <ArrowUpRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Developer resources */}
        <div
          className="rounded-2xl border border-[#1A2642] p-6"
          style={{ background: '#0D1421' }}
        >
          <p className="font-semibold text-white mb-1">Developer Resources</p>
          <p className="text-xs text-slate-500 mb-4">Everything you need, one click away.</p>
          <div className="flex flex-col gap-2.5">
            {RESOURCES.map((r) => (
              <Link
                key={r.label}
                href={r.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#1A2642] hover:border-[#2A3D64] transition-colors"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))',
                    border: '1px solid rgba(99,102,241,0.2)',
                  }}
                >
                  <r.icon size={15} style={{ color: '#A5B4FC' }} />
                </div>
                <span className="text-sm text-slate-300">{r.label}</span>
                <ArrowUpRight size={14} className="ml-auto text-slate-600" />
              </Link>
            ))}
          </div>
        </div>
      </div>

{/* ── Recent Activity ── */}
      <div
        className="rounded-2xl border border-[#1A2642]"
        style={{ background: '#0D1421' }}
      >
        <div className="px-6 py-4 border-b border-[#1A2642]">
          <p className="font-semibold text-white">Recent Activity</p>
        </div>
        <div className="divide-y divide-[#1A2642]">
          {recentActivity.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-slate-500">
              No activity yet. Create a project or place your first call.
            </div>
          ) : (
            recentActivity.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-6 py-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${item.color}1A`, border: `1px solid ${item.color}33` }}
                >
                  <PhoneCall size={15} style={{ color: item.color }} />
                </div>
                <p className="text-sm text-slate-300">{item.text}</p>
                <span className="ml-auto text-xs text-slate-600">{item.time}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Call details modal */}
      {selectedCall && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setSelectedCall(null)}
        >
          <div
            className="w-full max-w-md rounded-xl p-6"
            style={{ background: '#0D1421', border: '1px solid #2A3D64' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <p className="font-bold text-white">Call Details</p>
              <button
                onClick={() => setSelectedCall(null)}
                className="text-slate-500 hover:text-white transition-colors text-sm"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <Row label="Call ID" value={selectedCall.id} mono />
              <Row label="Caller" value={selectedCall.callerId} />
              <Row label="Receiver" value={selectedCall.receiverId} />
              <Row label="Type" value={selectedCall.type} />
              <Row label="Status" value={statusLabel(selectedCall.status)} />
              <Row label="Created" value={new Date(selectedCall.createdAt).toLocaleString('en-US')} />
              <Row
                label="Started"
                value={selectedCall.startedAt ? new Date(selectedCall.startedAt).toLocaleString('en-US') : '—'}
              />
              <Row
                label="Ended"
                value={selectedCall.endedAt ? new Date(selectedCall.endedAt).toLocaleString('en-US') : '—'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniType({
  label,
  mins,
  costPaise,
  showCost,
}: {
  label: string;
  mins: number;
  costPaise: number;
  showCost?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#1A2642] px-4 py-3 text-center" style={{ background: '#0A0F1E' }}>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="text-lg font-bold text-white mt-0.5">
        {Math.round(mins).toLocaleString()}
        <span className="text-xs font-normal text-slate-500"> min</span>
      </p>
      {showCost && <p className="text-[11px] font-semibold text-violet-300">{paiseToINR(costPaise)}</p>}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-2xl border border-[#1A2642] p-5"
      style={{ background: '#0D1421' }}
    >
      <p className="text-xs text-slate-500 mb-2">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value.toLocaleString()}</p>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className={`text-slate-300 text-right break-all ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case 'ACCEPTED': return 'Completed';
    case 'RINGING':
    case 'INITIATED': return 'Ringing';
    case 'REJECTED': return 'Rejected';
    case 'MISSED': return 'Missed';
    case 'ENDED': return 'Ended';
    default: return status;
  }
}

function statusBadge(status: string): 'default' | 'purple' | 'success' | 'error' | 'warning' {
  switch (status) {
    case 'ACCEPTED': return 'success';
    case 'RINGING':
    case 'INITIATED': return 'warning';
    case 'REJECTED':
    case 'MISSED': return 'error';
    case 'ENDED': return 'default';
    default: return 'default';
  }
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function callDuration(call: Call): string {
  if (!call.startedAt) return '—';
  const end = call.endedAt ? new Date(call.endedAt).getTime() : Date.now();
  const secs = Math.floor((end - new Date(call.startedAt).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}
