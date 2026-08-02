'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

// ── Sidebar nav ───────────────────────────────────────────────────────────────
const NAV = [
  { group: 'Start here', items: [{ id: 'quickstart', label: '⚡ Quick Start' }, { id: 'how-it-works', label: '🔄 How it works' }, { id: 'authentication', label: '🔑 Authentication' }] },
  { group: 'REST API', items: [{ id: 'api-create', label: 'POST /calls' }, { id: 'api-accept', label: 'PATCH /calls/:id/accept' }, { id: 'api-reject', label: 'PATCH /calls/:id/reject' }, { id: 'api-end', label: 'PATCH /calls/:id/end' }, { id: 'api-get', label: 'GET /calls/:id' }] },
  { group: 'Real-time', items: [{ id: 'websocket', label: '🔌 WebSocket Events' }, { id: 'webhooks', label: '🪝 Webhooks' }] },
  { group: 'SDK', items: [{ id: 'sdk', label: '📦 Node.js SDK' }] },
  { group: 'Reference', items: [{ id: 'errors', label: '🚨 Errors' }, { id: 'debugging', label: '🔍 Debugging' }] },
];

// ── Tiny primitives ───────────────────────────────────────────────────────────
type LangKey = 'sdk' | 'node' | 'python' | 'curl';

function MethodBadge({ verb }: { verb: 'GET' | 'POST' | 'PATCH' | 'DELETE' }) {
  const c: Record<string, string> = { GET: '#10B981', POST: '#6366F1', PATCH: '#F59E0B', DELETE: '#EF4444' };
  return (
    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded" style={{ background: `${c[verb]}22`, color: c[verb], border: `1px solid ${c[verb]}44` }}>
      {verb}
    </span>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text.trim()); setOk(true); setTimeout(() => setOk(false), 1500); }}
      className="text-xs font-mono px-2 py-0.5 rounded transition-all shrink-0"
      style={{ background: ok ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', color: ok ? '#10B981' : '#475569' }}>
      {ok ? '✓ copied' : 'copy'}
    </button>
  );
}

function Code({ code, label }: { code: string; label?: string }) {
  return (
    <div className="rounded-xl border border-[#1A2642] overflow-hidden" style={{ background: '#07111F' }}>
      {label && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#1A2642]">
          <span className="font-mono text-xs text-slate-600">{label}</span>
          <CopyBtn text={code} />
        </div>
      )}
      {!label && <div className="flex justify-end px-4 pt-3 pb-0"><CopyBtn text={code} /></div>}
      <pre className="font-mono text-xs text-slate-300 px-5 py-4 overflow-x-auto" style={{ lineHeight: 1.8 }}>{code.trim()}</pre>
    </div>
  );
}

function LangTabs({ tabs }: { tabs: Partial<Record<LangKey, string>> }) {
  const keys = Object.keys(tabs) as LangKey[];
  const labels: Record<LangKey, string> = { sdk: 'SDK', node: 'Node.js', python: 'Python', curl: 'cURL' };
  const [active, setActive] = useState<LangKey>(keys[0]);
  return (
    <div className="my-4">
      <div className="flex gap-1 mb-0 border-b border-[#1A2642]">
        {keys.map((k) => (
          <button key={k} onClick={() => setActive(k)}
            className="text-xs font-mono px-3 py-2 transition-all border-b-2 -mb-px"
            style={{ color: active === k ? '#A5B4FC' : '#475569', borderColor: active === k ? '#6366F1' : 'transparent', background: 'transparent' }}>
            {labels[k]}
          </button>
        ))}
      </div>
      <Code code={tabs[active] ?? ''} />
    </div>
  );
}

function Tip({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'warn' | 'tip' }) {
  const s = { info: { bg: 'rgba(99,102,241,0.07)', b: 'rgba(99,102,241,0.25)', icon: 'ℹ', c: '#A5B4FC' }, warn: { bg: 'rgba(245,158,11,0.07)', b: 'rgba(245,158,11,0.3)', icon: '⚠', c: '#FCD34D' }, tip: { bg: 'rgba(16,185,129,0.07)', b: 'rgba(16,185,129,0.3)', icon: '✓', c: '#6EE7B7' } }[type];
  return (
    <div className="flex gap-3 rounded-xl px-4 py-3 my-4 text-sm leading-relaxed border" style={{ background: s.bg, borderColor: s.b }}>
      <span style={{ color: s.c }}>{s.icon}</span>
      <span className="text-slate-300">{children}</span>
    </div>
  );
}

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return <section id={id} className="mb-20 scroll-mt-20">{children}</section>;
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="font-bold text-white mb-6 pb-3 border-b border-[#1A2642]" style={{ fontSize: '1.35rem', letterSpacing: '-0.02em' }}>{children}</h2>;
}

// ── Accordion endpoint card ───────────────────────────────────────────────────
function Endpoint({ method, path, summary, children, id }: { method: 'GET' | 'POST' | 'PATCH' | 'DELETE'; path: string; summary: string; children: React.ReactNode; id?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div id={id} className="rounded-xl border border-[#1A2642] overflow-hidden mb-3 transition-all scroll-mt-20" style={{ background: open ? '#0A1525' : '#0D1421' }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/[0.02] transition-all">
        <MethodBadge verb={method} />
        <code className="font-mono text-sm text-slate-200">{path}</code>
        <span className="text-slate-500 text-xs ml-2 hidden sm:block">— {summary}</span>
        <span className="ml-auto text-slate-600 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-5 pb-5 pt-1 border-t border-[#1A2642]">{children}</div>}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function DocsPage() {
  const [activeId, setActiveId] = useState('quickstart');

  useEffect(() => {
    const ob = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActiveId(e.target.id); }),
      { rootMargin: '-15% 0px -65% 0px' }
    );
    document.querySelectorAll('section[id]').forEach((el) => ob.observe(el));
    return () => ob.disconnect();
  }, []);

  return (
    <div style={{ background: '#060B18', color: '#F1F5F9', minHeight: '100vh' }}>

      {/* nav */}
      <header className="sticky top-0 z-50" style={{ background: 'rgba(6,11,24,0.92)', borderBottom: '1px solid #1A2642', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/" className="font-mono font-bold text-white text-sm">BlueJoinet</Link>
          <span className="text-slate-700">/</span>
          <span className="text-sm text-slate-500">Docs</span>
          <div className="ml-auto flex items-center gap-4">
            <Link href="/dashboard/playground" className="text-xs text-slate-400 hover:text-white transition-colors">Playground →</Link>
            <Link href="/signup" className="text-xs text-white px-3 py-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>Get API key</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">

        {/* sidebar */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-8 px-4 border-r border-[#1A2642]">
          {NAV.map((g) => (
            <div key={g.group} className="mb-5">
              <p className="font-mono text-xs text-slate-700 uppercase tracking-widest mb-2 px-3">{g.group}</p>
              {g.items.map((item) => (
                <a key={item.id} href={`#${item.id}`}
                  className="flex items-center text-xs px-3 py-1.5 rounded-lg transition-all mb-0.5"
                  style={{ color: activeId === item.id ? '#A5B4FC' : '#64748B', background: activeId === item.id ? 'rgba(99,102,241,0.1)' : 'transparent', borderLeft: activeId === item.id ? '2px solid #6366F1' : '2px solid transparent' }}>
                  {item.label}
                </a>
              ))}
            </div>
          ))}
        </aside>

        {/* content */}
        <main className="flex-1 min-w-0 px-6 lg:px-10 py-10 max-w-3xl">

          {/* ── Quick Start ───────────────────────────── */}
          <Section id="quickstart">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-4 border" style={{ background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)', color: '#A5B4FC' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Start here
              </div>
              <h1 className="font-bold text-white mb-3" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', letterSpacing: '-0.03em' }}>
                First call in 5 minutes
              </h1>
              <p className="text-slate-400 text-base leading-relaxed">
                Two API calls. Two URLs. That's the entire integration.
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-3 mb-8">
              {[
                { n: '01', title: 'Get your API key', body: 'Sign up → create a project → copy your key (starts with bj_live_).' },
                { n: '02', title: 'Install the SDK', body: null },
                { n: '03', title: 'Create a call from your backend', body: null },
                { n: '04', title: 'Redirect each user — done', body: 'Alice opens callerUrl, Bob opens receiverUrl. BlueJoinet handles the rest.' },
              ].map((step, i) => (
                <div key={step.n} className="flex gap-4 rounded-xl border border-[#1A2642] p-5 transition-all hover:border-[#2A3D64]" style={{ background: '#0D1421' }}>
                  <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-mono text-xs font-bold" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', color: '#A5B4FC', border: '1px solid rgba(99,102,241,0.25)' }}>
                    {step.n}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm mb-1">{step.title}</p>
                    {step.body && <p className="text-xs text-slate-500">{step.body}</p>}
                    {i === 1 && <Code code="npm install @bluejoinet/sdk" />}
                    {i === 2 && (
                      <LangTabs tabs={{
                        sdk: `import BlueJoinet from '@bluejoinet/sdk';
const bj = new BlueJoinet({ apiKey: process.env.BLUEJOINET_API_KEY });

const { callId, callerUrl, receiverUrl } = await bj.createCall({
  callerId: 'user_alice',
  receiverId: 'user_bob',
});`,
                        node: `const res = await fetch('https://api.yourdomain.com/calls', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer bj_live_your_key',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ callerId: 'user_alice', receiverId: 'user_bob' }),
});
const { callId, callerUrl, receiverUrl } = await res.json();`,
                        python: `import httpx

async with httpx.AsyncClient() as client:
    r = await client.post(
        'https://api.yourdomain.com/calls',
        headers={'Authorization': 'Bearer bj_live_your_key'},
        json={'callerId': 'user_alice', 'receiverId': 'user_bob'},
    )
data = r.json()
caller_url  = data['callerUrl']
receiver_url = data['receiverUrl']`,
                        curl: `curl -X POST https://api.yourdomain.com/calls \\
  -H "Authorization: Bearer bj_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"callerId":"user_alice","receiverId":"user_bob"}'`,
                      }} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Tip type="info">
              Your <strong>bj_live_</strong> API key is server-side only. Never send it to the browser.
            </Tip>
          </Section>

          {/* ── How it works ─────────────────────────── */}
          <Section id="how-it-works">
            <Heading>How it works</Heading>

            {/* Visual flow */}
            <div className="rounded-xl border border-[#1A2642] p-6 mb-6" style={{ background: '#0D1421' }}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
                {[
                  { icon: '🖥', label: 'Your backend', sub: 'POST /calls' },
                  null,
                  { icon: '⚡', label: 'BlueJoinet', sub: 'Returns 2 URLs' },
                  null,
                  { icon: '👤', label: 'Alice (caller)', sub: 'Opens callerUrl' },
                  null,
                  { icon: '👤', label: 'Bob (receiver)', sub: 'Opens receiverUrl' },
                ].map((item, i) =>
                  item === null ? (
                    <div key={i} className="text-slate-700 text-lg hidden sm:block">→</div>
                  ) : (
                    <div key={item.label} className="flex flex-col items-center gap-1">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-[#2A3D64]" style={{ background: '#060B18' }}>{item.icon}</div>
                      <p className="text-xs font-semibold text-white">{item.label}</p>
                      <p className="font-mono text-xs text-slate-600">{item.sub}</p>
                    </div>
                  )
                )}
              </div>
              <div className="mt-6 pt-5 border-t border-[#1A2642] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
                <div><span className="text-indigo-400 font-semibold">Signaling</span> — WebSocket events between browser and server</div>
                <div><span className="text-indigo-400 font-semibold">WebRTC</span> — peer-to-peer media, negotiated automatically</div>
                <div><span className="text-indigo-400 font-semibold">TURN</span> — relay for calls behind strict firewalls</div>
              </div>
            </div>

            {/* 3 tokens */}
            <p className="text-sm font-semibold text-white mb-3">Three types of credentials</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { prefix: 'bj_live_...', name: 'API Key', who: 'Your server → REST API', color: '#6366F1' },
                { prefix: 'bj_session_...', name: 'Session Token', who: 'Browser → WebSocket', color: '#8B5CF6' },
                { prefix: 'JWT Bearer', name: 'Dashboard JWT', who: 'Dashboard UI → management API', color: '#A78BFA' },
              ].map((t) => (
                <div key={t.name} className="rounded-xl border border-[#1A2642] p-4" style={{ background: '#0A1525' }}>
                  <code className="font-mono text-xs block mb-2" style={{ color: t.color }}>{t.prefix}</code>
                  <p className="text-xs font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.who}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Authentication ───────────────────────── */}
          <Section id="authentication">
            <Heading>Authentication</Heading>
            <p className="text-slate-400 text-sm mb-4">Every REST request needs your API key in the Authorization header.</p>
            <Code code="Authorization: Bearer bj_live_your_key_here" label="Header" />
            <Tip type="warn">
              Session tokens in <code className="font-mono text-xs bg-black/30 px-1 rounded">callerUrl</code> / <code className="font-mono text-xs bg-black/30 px-1 rounded">receiverUrl</code> are single-use. Do not cache or reuse them.
            </Tip>
          </Section>

          {/* ── REST API ─────────────────────────────── */}
          <Section id="api-create">
            <Heading>REST API</Heading>
            <p className="text-slate-400 text-sm mb-5">Base URL: <code className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: '#0D1421', color: '#A5B4FC' }}>https://api.yourdomain.com</code></p>

            {/* POST /calls */}
            <Endpoint method="POST" path="/calls" summary="Create a call">
              <p className="text-slate-400 text-sm mb-4 mt-3">Creates a call session and returns two participant URLs.</p>

              <p className="text-xs font-semibold text-slate-300 mb-2">Request body</p>
              <div className="rounded-lg border border-[#1A2642] overflow-hidden mb-4">
                <table className="w-full text-xs">
                  <thead><tr style={{ background: '#060B18' }}><th className="text-left px-3 py-2 text-slate-600 font-mono font-normal">field</th><th className="text-left px-3 py-2 text-slate-600 font-mono font-normal">type</th><th className="text-left px-3 py-2 text-slate-600 font-mono font-normal">required</th></tr></thead>
                  <tbody>
                    {[
                      { f: 'callerId', t: 'string', r: true },
                      { f: 'receiverId', t: 'string', r: true },
                      { f: 'type', t: '"VIDEO" | "AUDIO"', r: false },
                    ].map((row) => (
                      <tr key={row.f} className="border-t border-[#1A2642]">
                        <td className="px-3 py-2 font-mono" style={{ color: '#A5B4FC' }}>{row.f}</td>
                        <td className="px-3 py-2 text-slate-500">{row.t}</td>
                        <td className="px-3 py-2" style={{ color: row.r ? '#F87171' : '#475569' }}>{row.r ? 'required' : 'optional'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <LangTabs tabs={{
                sdk: `const { callId, callerUrl, receiverUrl } = await bj.createCall({
  callerId: 'user_alice',
  receiverId: 'user_bob',
});`,
                curl: `curl -X POST https://api.yourdomain.com/calls \\
  -H "Authorization: Bearer bj_live_key" \\
  -H "Content-Type: application/json" \\
  -d '{"callerId":"user_alice","receiverId":"user_bob"}'`,
              }} />

              <p className="text-xs font-semibold text-slate-300 mb-2 mt-4">Response — 201</p>
              <Code code={`{
  "callId": "clx8f2z...",
  "status": "PENDING",
  "callerUrl": "https://yourdomain.com/call?token=bj_session_...&callId=clx8f...",
  "receiverUrl": "https://yourdomain.com/call?token=bj_session_...&callId=clx8f..."
}`} />
            </Endpoint>

            {/* PATCH accept */}
            <Endpoint method="PATCH" path="/calls/:callId/accept" summary="Accept a call" id="api-accept">
              <p className="text-slate-400 text-sm mb-4 mt-3">Marks a call as accepted. The hosted UI does this automatically when the receiver taps Accept.</p>
              <LangTabs tabs={{ sdk: `await bj.acceptCall('clx8f2z...');`, curl: `curl -X PATCH https://api.yourdomain.com/calls/CALL_ID/accept \\
  -H "Authorization: Bearer bj_live_key"` }} />
              <Code code={`{ "callId": "clx8f2z...", "status": "ACTIVE" }`} />
            </Endpoint>

            {/* PATCH reject */}
            <Endpoint method="PATCH" path="/calls/:callId/reject" summary="Reject a call" id="api-reject">
              <p className="text-slate-400 text-sm mb-4 mt-3">Receiver declines. The caller's UI is notified via WebSocket.</p>
              <LangTabs tabs={{ sdk: `await bj.rejectCall('clx8f2z...');`, curl: `curl -X PATCH https://api.yourdomain.com/calls/CALL_ID/reject \\
  -H "Authorization: Bearer bj_live_key"` }} />
              <Code code={`{ "callId": "clx8f2z...", "status": "REJECTED" }`} />
            </Endpoint>

            {/* PATCH end */}
            <Endpoint method="PATCH" path="/calls/:callId/end" summary="End a call" id="api-end">
              <p className="text-slate-400 text-sm mb-4 mt-3">Ends an active call. Both participants receive a WebSocket <code className="font-mono text-xs bg-black/30 px-1 rounded">call-ended</code> event.</p>
              <LangTabs tabs={{ sdk: `await bj.endCall('clx8f2z...');`, curl: `curl -X PATCH https://api.yourdomain.com/calls/CALL_ID/end \\
  -H "Authorization: Bearer bj_live_key"` }} />
              <Code code={`{ "callId": "clx8f2z...", "status": "ENDED" }`} />
            </Endpoint>

            {/* GET call */}
            <Endpoint method="GET" path="/calls/:callId" summary="Get call status" id="api-get">
              <p className="text-slate-400 text-sm mb-4 mt-3">Returns the current state of a call.</p>
              <LangTabs tabs={{ sdk: `const call = await bj.getCall('clx8f2z...');`, curl: `curl https://api.yourdomain.com/calls/CALL_ID \\
  -H "Authorization: Bearer bj_live_key"` }} />
              <Code code={`{
  "callId": "clx8f2z...",
  "status": "ACTIVE",
  "type": "VIDEO",
  "callerId": "user_alice",
  "receiverId": "user_bob",
  "createdAt": "2026-08-01T10:00:00.000Z",
  "acceptedAt": "2026-08-01T10:00:15.000Z",
  "endedAt": null
}`} />
              <div className="flex flex-wrap gap-2 mt-3">
                {[{ s: 'PENDING', c: '#F59E0B' }, { s: 'ACTIVE', c: '#10B981' }, { s: 'ENDED', c: '#64748B' }, { s: 'REJECTED', c: '#EF4444' }].map(({ s, c }) => (
                  <span key={s} className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: `${c}22`, color: c, border: `1px solid ${c}44` }}>{s}</span>
                ))}
              </div>
            </Endpoint>
          </Section>

          {/* ── WebSocket ─────────────────────────────── */}
          <Section id="websocket">
            <Heading>WebSocket Events</Heading>
            <p className="text-slate-400 text-sm mb-5">The hosted call UI connects automatically. Build a custom client? Here's the full reference.</p>

            <Code label="connect" code={`import { io } from 'socket.io-client';

const socket = io('https://api.yourdomain.com', {
  auth: { token: 'bj_session_...' },
  transports: ['websocket'],
});

socket.on('connect', () => {
  socket.emit('authenticate', { token: 'bj_session_...' });
});`} />

            {/* Event cards */}
            <div className="space-y-3 mt-5">
              {[
                { event: 'incoming-call', dir: '→ receiver', color: '#6366F1', desc: 'Fired when the caller is ready. Show incoming call UI.', payload: `{ callId: 'clx8f2z...', callerId: 'user_alice', type: 'VIDEO' }` },
                { event: 'call-accepted', dir: '→ caller', color: '#10B981', desc: 'Receiver accepted. Start WebRTC offer/answer.', payload: `{ callId: 'clx8f2z...' }` },
                { event: 'call-rejected', dir: '→ caller', color: '#EF4444', desc: 'Receiver declined.', payload: `{ callId: 'clx8f2z...' }` },
                { event: 'call-ended', dir: '→ both', color: '#F59E0B', desc: 'Either side ended the call.', payload: `{ callId: 'clx8f2z...' }` },
                { event: 'offer / answer / ice-candidate', dir: '↔ both', color: '#8B5CF6', desc: 'WebRTC signaling events relayed by the server.', payload: `{ callId, offer? / answer? / candidate? }` },
              ].map((ev) => (
                <div key={ev.event} className="rounded-xl border border-[#1A2642] p-4" style={{ background: '#0D1421' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <code className="font-mono text-xs font-bold" style={{ color: ev.color }}>{ev.event}</code>
                    <span className="text-xs text-slate-600 font-mono">{ev.dir}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{ev.desc}</p>
                  <code className="font-mono text-xs text-slate-600">{ev.payload}</code>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Webhooks ──────────────────────────────── */}
          <Section id="webhooks">
            <Heading>Webhooks</Heading>
            <p className="text-slate-400 text-sm mb-5">BlueJoinet POSTs a signed event to your server on every call lifecycle change.</p>

            {/* Setup */}
            <div className="rounded-xl border border-[#1A2642] p-5 mb-5" style={{ background: '#0D1421' }}>
              <p className="text-xs font-semibold text-white mb-3">Setup — Dashboard</p>
              <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                <span className="px-3 py-1 rounded-lg border border-[#2A3D64]" style={{ background: '#060B18' }}>Open project</span>
                <span className="text-slate-700">→</span>
                <span className="px-3 py-1 rounded-lg border border-[#2A3D64]" style={{ background: '#060B18' }}>Webhook section</span>
                <span className="text-slate-700">→</span>
                <span className="px-3 py-1 rounded-lg border border-[#2A3D64]" style={{ background: '#060B18' }}>Paste your URL</span>
                <span className="text-slate-700">→</span>
                <span className="px-3 py-1 rounded-lg border border-[#2A3D64] text-green-400" style={{ background: '#060B18' }}>Secret auto-generated</span>
              </div>
            </div>

            {/* Events */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {['call.created', 'call.accepted', 'call.rejected', 'call.ended'].map((ev) => (
                <div key={ev} className="rounded-lg border border-[#1A2642] px-3 py-2 font-mono text-xs" style={{ background: '#0A1525', color: '#A5B4FC' }}>{ev}</div>
              ))}
            </div>

            {/* Verify */}
            <p className="text-sm font-semibold text-white mb-3">Verify the signature</p>
            <Tip type="warn">
              Always verify the <code className="font-mono text-xs bg-black/30 px-1 rounded">X-BlueJoinet-Signature</code> header before processing. Use <code className="font-mono text-xs bg-black/30 px-1 rounded">express.raw()</code> — do not parse JSON first.
            </Tip>
            <LangTabs tabs={{
              node: `import crypto from 'crypto';
import express from 'express';

app.post('/webhooks/bluejoinet',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const sig      = req.headers['x-bluejoinet-signature'];
    const expected = 'sha256=' + crypto
      .createHmac('sha256', process.env.BLUEJOINET_WEBHOOK_SECRET)
      .update(req.body)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return res.status(401).send('invalid signature');
    }

    const event = JSON.parse(req.body);
    // event.event → 'call.created' | 'call.accepted' | ...
    res.json({ ok: true });
  }
);`,
              python: `import hmac, hashlib, os
from fastapi import FastAPI, Request, HTTPException

app = FastAPI()
SECRET = os.environ['BLUEJOINET_WEBHOOK_SECRET'].encode()

@app.post('/webhooks/bluejoinet')
async def webhook(request: Request):
    body = await request.body()
    sig  = request.headers.get('x-bluejoinet-signature', '')
    expected = 'sha256=' + hmac.new(SECRET, body, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(sig, expected):
        raise HTTPException(status_code=401, detail='invalid signature')

    event = await request.json()
    return {'ok': True}`,
            }} />
          </Section>

          {/* ── SDK ───────────────────────────────────── */}
          <Section id="sdk">
            <Heading>Node.js SDK</Heading>
            <Code code="npm install @bluejoinet/sdk" label="install" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-5">
              {[
                { method: 'bj.createCall({ callerId, receiverId, type? })', returns: '{ callId, callerUrl, receiverUrl }' },
                { method: 'bj.acceptCall(callId)', returns: '{ callId, status }' },
                { method: 'bj.rejectCall(callId)', returns: '{ callId, status }' },
                { method: 'bj.endCall(callId)', returns: '{ callId, status }' },
                { method: 'bj.getCall(callId)', returns: 'Full call object' },
              ].map((m) => (
                <div key={m.method} className="rounded-xl border border-[#1A2642] p-4" style={{ background: '#0D1421' }}>
                  <code className="font-mono text-xs block mb-2" style={{ color: '#A5B4FC' }}>{m.method}</code>
                  <p className="text-xs text-slate-500">→ {m.returns}</p>
                </div>
              ))}
            </div>

            <Code label="usage" code={`import BlueJoinet from '@bluejoinet/sdk';

const bj = new BlueJoinet({
  apiKey: process.env.BLUEJOINET_API_KEY,
  baseUrl: 'https://api.yourdomain.com',  // optional
});

const { callId, callerUrl, receiverUrl } = await bj.createCall({
  callerId: 'user_alice',
  receiverId: 'user_bob',
});`} />
          </Section>

          {/* ── Errors ───────────────────────────────── */}
          <Section id="errors">
            <Heading>Error Codes</Heading>
            <div className="rounded-xl border border-[#1A2642] overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr style={{ background: '#0D1421' }}><th className="text-left px-4 py-2.5 text-slate-600 font-mono font-normal">status</th><th className="text-left px-4 py-2.5 text-slate-600 font-mono font-normal">meaning</th><th className="text-left px-4 py-2.5 text-slate-600 font-mono font-normal">fix</th></tr></thead>
                <tbody>
                  {[
                    { code: '400', label: 'Bad Request', fix: 'Check request body — missing required field.' },
                    { code: '401', label: 'Unauthorized', fix: 'API key or session token is missing, invalid, or expired.' },
                    { code: '403', label: 'Forbidden', fix: 'You do not own this resource.' },
                    { code: '404', label: 'Not Found', fix: 'callId does not exist or belongs to another project.' },
                    { code: '409', label: 'Conflict', fix: 'Call is already ENDED or REJECTED.' },
                    { code: '429', label: 'Rate Limited', fix: 'Slow down — too many requests per second.' },
                    { code: '500', label: 'Server Error', fix: 'Temporary. Retry with backoff. Contact support if persistent.' },
                  ].map((row, i) => {
                    const c = Number(row.code) >= 500 ? '#F87171' : Number(row.code) >= 400 ? '#FCD34D' : '#A5B4FC';
                    return (
                      <tr key={row.code} className="border-t border-[#1A2642]" style={{ background: i % 2 === 0 ? '#060B18' : '#070D1C' }}>
                        <td className="px-4 py-2.5 font-mono font-bold" style={{ color: c }}>{row.code}</td>
                        <td className="px-4 py-2.5 text-white">{row.label}</td>
                        <td className="px-4 py-2.5 text-slate-500">{row.fix}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── Debugging ─────────────────────────────── */}
          <Section id="debugging">
            <Heading>Debugging</Heading>
            <p className="text-slate-400 text-sm mb-5">The most common call failures and exactly how to fix them.</p>
            <div className="space-y-3">
              {[
                { err: 'ICE_FAILED', cause: 'Both peers behind strict NATs, STUN failed.', fix: 'TURN should handle this automatically. Check that /turn-credentials returns iceServers with turn: URLs.' },
                { err: 'WebSocket drops right after authenticate', cause: 'Session token is invalid, expired, or used by the wrong participant.', fix: 'callerUrl token is for Alice only. receiverUrl token is for Bob only. Do not swap.' },
                { err: 'offer sent, no answer', cause: "Receiver's socket disconnected mid-negotiation.", fix: 'Add socket reconnect logic. Ensure receiver page stays loaded during negotiation.' },
                { err: 'call-accepted fires, no video', cause: 'Camera / microphone permission denied.', fix: 'Call getUserMedia() before the call starts. Catch NotAllowedError and prompt the user.' },
                { err: '401 on first request', cause: 'Zustand / localStorage not rehydrated yet.', fix: 'Read token from localStorage as a sync fallback in your Axios interceptor.' },
              ].map((item) => (
                <div key={item.err} className="rounded-xl border border-[#1A2642] p-5 grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ background: '#0D1421' }}>
                  <div>
                    <p className="font-mono text-xs mb-1" style={{ color: '#FCD34D' }}>Error</p>
                    <p className="text-xs text-white font-semibold">{item.err}</p>
                  </div>
                  <div>
                    <p className="font-mono text-xs mb-1 text-slate-600">Cause</p>
                    <p className="text-xs text-slate-400">{item.cause}</p>
                  </div>
                  <div>
                    <p className="font-mono text-xs mb-1" style={{ color: '#6EE7B7' }}>Fix</p>
                    <p className="text-xs text-slate-400">{item.fix}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Final CTA */}
            <div className="mt-12 rounded-xl p-8 text-center border border-[#2A3D64]" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))' }}>
              <p className="font-bold text-white mb-2 text-lg">Still stuck?</p>
              <p className="text-slate-400 text-sm mb-6">Try the playground — make a call in your browser with no code, no API key required.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/dashboard/playground" className="inline-flex items-center gap-2 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                  Open playground →
                </Link>
                <Link href="/signup" className="inline-flex items-center gap-2 text-slate-300 font-medium text-sm px-6 py-2.5 rounded-lg border border-[#1A2642] hover:border-[#2A3D64] transition-all">
                  Get API key
                </Link>
              </div>
            </div>
          </Section>

        </main>
      </div>
    </div>
  );
}
