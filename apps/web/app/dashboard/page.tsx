'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);

  const [webhookInputs, setWebhookInputs] = useState<Record<string, string>>({});
  const [savingWebhook, setSavingWebhook] = useState<string | null>(null);
  const [webhookSaved, setWebhookSaved] = useState<string | null>(null);

useEffect(() => {
    if (!isReady) return;
    if (!token) { router.push('/login'); return; }
    fetchProjects();
    fetchDashboardData();
  }, [isReady, token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchProjects() {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
      const inputs: Record<string, string> = {};
      for (const p of res.data) inputs[p.id] = p.webhookUrl ?? '';
      setWebhookInputs(inputs);
    } catch {
      logout(); router.push('/login');
    } finally {
      setLoading(false);
    }
  }

  async function fetchDashboardData() {
    try {
      const [callsRes, usageRes] = await Promise.all([
        api.get('/dashboard/calls'),
        api.get('/dashboard/usage'),
      ]);
      setCalls(callsRes.data);
      setUsage(usageRes.data);
    } catch {
      // Non-fatal — dashboard still renders projects.
    }
  }

  async function fetchKeys(projectId: string) {
    if (projectKeys[projectId]) return;
    const res = await api.get(`/api-keys/${projectId}`);
    setProjectKeys((prev) => ({ ...prev, [projectId]: res.data }));
  }

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060B18' }}>
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
    <div className="min-h-screen" style={{ background: '#060B18' }}>
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-10">

        {/* Header row */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Projects</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your API keys and webhook settings.</p>
          </div>
          <Button onClick={() => { setShowNewProject(true); setNewProjectName(''); }}>
            + New Project
          </Button>
        </div>

        {/* Usage stats */}
        {usage && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Calls', value: usage.totalCalls, color: '#6366F1' },
              { label: 'Active Calls', value: usage.activeCalls, color: '#10B981' },
              { label: 'Minutes Used', value: usage.minutesUsed, color: '#F59E0B' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-[#1A2642] p-5"
                style={{ background: '#0D1421' }}
              >
                <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* New project form */}
        {showNewProject && (
          <Card className="mb-6">
            <div className="flex gap-3">
              <Input
                placeholder="Project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createProject()}
                autoFocus
                className="flex-1"
              />
              <Button onClick={createProject} loading={creatingProject}>Create</Button>
              <Button variant="ghost" onClick={() => setShowNewProject(false)}>Cancel</Button>
            </div>
          </Card>
        )}

        {/* Empty state */}
        {projects.length === 0 ? (
          <Card className="text-center py-16">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">No projects yet</p>
            <p className="text-slate-600 text-xs">Create a project to get your first API key.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {projects.map((project) => (
              <Card key={project.id} padding={false} glow={expandedId === project.id}>
                {/* Project header */}
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                  onClick={() => toggleProject(project.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                    >
                      {project.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{project.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(project.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {project.webhookUrl && <Badge variant="purple">webhook</Badge>}
                    <svg
                      className={`w-4 h-4 text-slate-500 transition-transform ${expandedId === project.id ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded panel */}
                {expandedId === project.id && (
                  <div style={{ borderTop: '1px solid #1A2642' }}>

                    {/* API Keys */}
                    <div className="px-5 py-5" style={{ borderBottom: '1px solid #1A2642' }}>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">API Keys</p>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => { setShowNewKey(project.id); setNewKeyName(''); }}
                        >
                          + New Key
                        </Button>
                      </div>

                      {showNewKey === project.id && (
                        <div className="flex gap-2 mb-4">
                          <Input
                            placeholder="Key name (e.g. production)"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && createKey(project.id)}
                            autoFocus
                            className="flex-1"
                          />
                          <Button onClick={() => createKey(project.id)} loading={creatingKey} size="sm">Create</Button>
                          <Button variant="ghost" size="sm" onClick={() => setShowNewKey(null)}>Cancel</Button>
                        </div>
                      )}

                      {!projectKeys[project.id] ? (
                        <p className="text-xs text-slate-600">Loading…</p>
                      ) : projectKeys[project.id].length === 0 ? (
                        <p className="text-xs text-slate-600">No API keys yet.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {projectKeys[project.id].map((k) => (
                            <div
                              key={k.id}
                              className="flex items-center justify-between px-4 py-3 rounded-lg"
                              style={{ background: '#060B18', border: '1px solid #1A2642' }}
                            >
                              <div>
                                <p className="text-sm font-medium text-white">{k.name}</p>
                                <p className="font-mono text-xs text-slate-500 mt-0.5">
                                  {k.key.slice(0, 18)}…{k.key.slice(-6)}
                                </p>
                              </div>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => copyKey(k.id, k.key)}
                              >
                                {copied === k.id ? '✓ Copied' : 'Copy'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Webhook */}
                    <div className="px-5 py-5">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Webhook</p>
                      <p className="text-xs text-slate-500 mb-4">
                        Receive HTTP POST events when calls are created, accepted, rejected, or ended.
                      </p>
                      <div className="flex gap-2 mb-4">
                        <Input
                          placeholder="https://your-server.com/webhook"
                          value={webhookInputs[project.id] ?? ''}
                          onChange={(e) => setWebhookInputs((prev) => ({ ...prev, [project.id]: e.target.value }))}
                          className="flex-1 font-mono text-xs"
                        />
                        <Button
                          variant={webhookSaved === project.id ? 'secondary' : 'primary'}
                          size="sm"
                          loading={savingWebhook === project.id}
                          onClick={() => saveWebhook(project.id)}
                        >
                          {webhookSaved === project.id ? '✓ Saved' : 'Save'}
                        </Button>
                      </div>

                      {project.webhookSecret && (
                        <div
                          className="rounded-lg px-4 py-3"
                          style={{ background: '#060B18', border: '1px solid #1A2642' }}
                        >
                          <p className="text-xs text-slate-500 mb-1">Signing Secret</p>
                          <p className="font-mono text-xs text-slate-300 break-all">{project.webhookSecret}</p>
                          <p className="text-xs text-slate-600 mt-2">
                            Verify with <code className="text-violet-400">X-BlueJoinet-Signature</code> header (HMAC-SHA256).
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* ── Calls ── */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Calls</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Active and past calls across all projects.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => fetchDashboardData()}>
              Refresh
            </Button>
          </div>

          {calls.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-slate-400 text-sm font-medium mb-1">No calls yet</p>
              <p className="text-slate-600 text-xs">
                Create a call from the playground or the API to see it here.
              </p>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {calls.slice(0, 50).map((call) => (
                <button
                  key={call.id}
                  onClick={() => setSelectedCall(call)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#1A2642] hover:border-[#2A3D64] transition-colors text-left"
                  style={{ background: '#0D1421' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusDot status={call.status} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {call.callerId} → {call.receiverId}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(call.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {call.project?.name && ` · ${call.project.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={call.type === 'VIDEO' ? 'purple' : 'default'}>
                      {call.type}
                    </Badge>
                    <Badge variant={statusBadge(call.status)}>{call.status}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

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
              <Row label="Status" value={selectedCall.status} />
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

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span
        className={`text-slate-300 text-right break-all ${mono ? 'font-mono text-xs' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'ACCEPTED' ? '#10B981'
      : status === 'RINGING' ? '#F59E0B'
        : status === 'ENDED' ? '#64748B'
          : status === 'REJECTED' ? '#EF4444'
            : '#6366F1';
  return (
    <span
      className="w-2 h-2 rounded-full shrink-0"
      style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
    />
  );
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
