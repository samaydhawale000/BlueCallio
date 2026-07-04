'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth.store';
import { api } from '../lib/api';

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

export default function DashboardPage() {
  const { token, logout } = useAuthStore();
  const router = useRouter();

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

  const [webhookInputs, setWebhookInputs] = useState<Record<string, string>>({});
  const [savingWebhook, setSavingWebhook] = useState<string | null>(null);
  const [webhookSaved, setWebhookSaved] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProjects();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchProjects() {
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
  }

  async function fetchKeys(projectId: string) {
    if (projectKeys[projectId]) return;
    const res = await api.get(`/api-keys/${projectId}`);
    setProjectKeys((prev) => ({ ...prev, [projectId]: res.data }));
  }

  async function toggleProject(projectId: string) {
    if (expandedId === projectId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(projectId);
    await fetchKeys(projectId);
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
    } finally {
      setCreatingProject(false);
    }
  }

  async function createKey(projectId: string) {
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const res = await api.post('/api-keys', { projectId, name: newKeyName.trim() });
      setProjectKeys((prev) => ({
        ...prev,
        [projectId]: [res.data, ...(prev[projectId] ?? [])],
      }));
      setNewKeyName('');
      setShowNewKey(null);
    } finally {
      setCreatingKey(false);
    }
  }

  async function saveWebhook(projectId: string) {
    setSavingWebhook(projectId);
    try {
      const url = webhookInputs[projectId]?.trim() || null;
      const res = await api.patch(`/projects/${projectId}/webhook`, { webhookUrl: url });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, webhookUrl: res.data.webhookUrl, webhookSecret: res.data.webhookSecret }
            : p,
        ),
      );
      setWebhookSaved(projectId);
      setTimeout(() => setWebhookSaved(null), 2500);
    } finally {
      setSavingWebhook(null);
    }
  }

  async function copyKey(keyId: string, key: string) {
    await navigator.clipboard.writeText(key);
    setCopied(keyId);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleLogout() {
    logout();
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-lg tracking-tight">BlueCall</span>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-black">
          Logout
        </button>
      </header>

      <main className="max-w-3xl mx-auto py-10 px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold">Projects</h2>
          <button
            onClick={() => { setShowNewProject(true); setNewProjectName(''); }}
            className="bg-black text-white text-sm px-4 py-2 hover:bg-gray-800"
          >
            + New Project
          </button>
        </div>

        {showNewProject && (
          <div className="flex gap-2 mb-4 bg-white border p-3">
            <input
              autoFocus
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createProject()}
              placeholder="Project name"
              className="border p-2 flex-1 text-sm"
            />
            <button
              onClick={createProject}
              disabled={creatingProject}
              className="bg-black text-white text-sm px-4 py-2 disabled:opacity-50"
            >
              {creatingProject ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => setShowNewProject(false)}
              className="text-sm text-gray-500 hover:text-black px-2"
            >
              Cancel
            </button>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No projects yet.</p>
            <p className="text-sm mt-1">Create one to get your first API key.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div key={project.id} className="bg-white border">
                <button
                  className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50"
                  onClick={() => toggleProject(project.id)}
                >
                  <div>
                    <p className="font-medium text-sm">{project.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(project.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className="text-gray-400 text-xs">
                    {expandedId === project.id ? '▲' : '▼'}
                  </span>
                </button>

                {expandedId === project.id && (
                  <div className="border-t">
                    {/* API Keys */}
                    <div className="px-4 pt-3 pb-4 border-b">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          API Keys
                        </p>
                        <button
                          onClick={() => { setShowNewKey(project.id); setNewKeyName(''); }}
                          className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5"
                        >
                          + New Key
                        </button>
                      </div>

                      {showNewKey === project.id && (
                        <div className="flex gap-2 mb-3">
                          <input
                            autoFocus
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && createKey(project.id)}
                            placeholder="Key name (e.g. production)"
                            className="border p-1.5 flex-1 text-sm"
                          />
                          <button
                            onClick={() => createKey(project.id)}
                            disabled={creatingKey}
                            className="bg-black text-white text-xs px-3 py-1.5 disabled:opacity-50"
                          >
                            {creatingKey ? 'Creating...' : 'Create'}
                          </button>
                          <button
                            onClick={() => setShowNewKey(null)}
                            className="text-xs text-gray-500 hover:text-black px-2"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {!projectKeys[project.id] ? (
                        <p className="text-xs text-gray-400">Loading...</p>
                      ) : projectKeys[project.id].length === 0 ? (
                        <p className="text-xs text-gray-400">No API keys yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {projectKeys[project.id].map((k) => (
                            <div
                              key={k.id}
                              className="flex items-center justify-between bg-gray-50 px-3 py-2.5"
                            >
                              <div>
                                <p className="text-sm font-medium">{k.name}</p>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">
                                  {k.key.slice(0, 20)}...{k.key.slice(-6)}
                                </p>
                              </div>
                              <button
                                onClick={() => copyKey(k.id, k.key)}
                                className="text-xs text-gray-500 hover:text-black px-3 py-1 border hover:border-gray-400 transition-colors"
                              >
                                {copied === k.id ? '✓ Copied' : 'Copy'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Webhook */}
                    <div className="px-4 pt-3 pb-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                        Webhook
                      </p>
                      <p className="text-xs text-gray-400 mb-2">
                        Receive HTTP POST events when calls are created, accepted, rejected, or ended.
                      </p>
                      <div className="flex gap-2 mb-3">
                        <input
                          value={webhookInputs[project.id] ?? ''}
                          onChange={(e) =>
                            setWebhookInputs((prev) => ({ ...prev, [project.id]: e.target.value }))
                          }
                          placeholder="https://your-server.com/webhook"
                          className="border p-1.5 flex-1 text-sm font-mono"
                        />
                        <button
                          onClick={() => saveWebhook(project.id)}
                          disabled={savingWebhook === project.id}
                          className="bg-black text-white text-xs px-4 py-1.5 disabled:opacity-50"
                        >
                          {savingWebhook === project.id
                            ? 'Saving...'
                            : webhookSaved === project.id
                            ? '✓ Saved'
                            : 'Save'}
                        </button>
                      </div>

                      {project.webhookSecret && (
                        <div className="bg-gray-50 border px-3 py-2.5">
                          <p className="text-xs text-gray-500 mb-1">Signing Secret</p>
                          <p className="text-xs font-mono text-gray-700 break-all">
                            {project.webhookSecret}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Verify requests using{' '}
                            <code className="bg-gray-200 px-1">X-BlueCall-Signature</code> header
                            (HMAC-SHA256).
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
