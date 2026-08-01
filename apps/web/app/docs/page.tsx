'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

// ── Sidebar nav structure ─────────────────────────────────────────────────────
const NAV = [
  {
    group: 'Getting Started',
    items: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'quickstart', label: 'Quick Start' },
      { id: 'authentication', label: 'Authentication' },
    ],
  },
  {
    group: 'REST API',
    items: [
      { id: 'create-call', label: 'Create Call' },
      { id: 'accept-call', label: 'Accept Call' },
      { id: 'reject-call', label: 'Reject Call' },
      { id: 'end-call', label: 'End Call' },
      { id: 'get-call', label: 'Get Call' },
      { id: 'turn-credentials', label: 'TURN Credentials' },
    ],
  },
  {
    group: 'WebSocket Events',
    items: [
      { id: 'ws-overview', label: 'Overview' },
      { id: 'ws-incoming-call', label: 'incoming-call' },
      { id: 'ws-call-accepted', label: 'call-accepted' },
      { id: 'ws-call-rejected', label: 'call-rejected' },
      { id: 'ws-call-ended', label: 'call-ended' },
      { id: 'ws-signaling', label: 'WebRTC Signaling' },
    ],
  },
  {
    group: 'Webhooks',
    items: [
      { id: 'webhook-setup', label: 'Setup' },
      { id: 'webhook-events', label: 'Events' },
      { id: 'webhook-verify', label: 'Verify Signature' },
    ],
  },
  {
    group: 'SDK Reference',
    items: [
      { id: 'sdk-install', label: 'Installation' },
      { id: 'sdk-init', label: 'Initialization' },
      { id: 'sdk-methods', label: 'Methods' },
    ],
  },
  {
    group: 'Errors & Debugging',
    items: [
      { id: 'error-codes', label: 'Error Codes' },
      { id: 'debugging', label: 'Debugging Calls' },
    ],
  },
  {
    group: 'Examples',
    items: [
      { id: 'example-nodejs', label: 'Node.js' },
      { id: 'example-python', label: 'Python' },
      { id: 'example-curl', label: 'cURL' },
    ],
  },
];

// ── Small helpers ─────────────────────────────────────────────────────────────
function Badge({ children, color = '#6366F1' }: { children: string; color?: string }) {
  return (
    <span
      className="inline-flex items-center font-mono text-xs px-2 py-0.5 rounded font-semibold"
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {children}
    </span>
  );
}

function Method({ verb }: { verb: 'GET' | 'POST' | 'PATCH' | 'DELETE' }) {
  const colors: Record<string, string> = { GET: '#10B981', POST: '#6366F1', PATCH: '#F59E0B', DELETE: '#EF4444' };
  return <Badge color={colors[verb]}>{verb}</Badge>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="text-xs font-mono px-2 py-1 rounded transition-all"
      style={{ background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', color: copied ? '#10B981' : '#64748B' }}
    >
      {copied ? 'copied!' : 'copy'}
    </button>
  );
}

function CodeBlock({ code, lang = 'js', title }: { code: string; lang?: string; title?: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1A2642] my-4" style={{ background: '#070C1A' }}>
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1A2642]">
          <span className="font-mono text-xs text-slate-500">{title}</span>
          <CopyButton text={code.trim()} />
        </div>
      )}
      {!title && (
        <div className="flex justify-end px-4 pt-3">
          <CopyButton text={code.trim()} />
        </div>
      )}
      <pre className="font-mono text-sm px-5 py-4 overflow-x-auto text-slate-300" style={{ lineHeight: '1.75' }}>
        {code.trim()}
      </pre>
    </div>
  );
}

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-16 scroll-mt-20">
      {children}
    </section>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-bold text-white mb-4 pb-3 border-b border-[#1A2642]"
      style={{ fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-semibold text-white mt-8 mb-3" style={{ fontSize: '1.1rem' }}>
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-400 leading-relaxed mb-4">{children}</p>;
}

function ParamTable({ rows }: { rows: { name: string; type: string; required?: boolean; desc: string }[] }) {
  return (
    <div className="rounded-xl border border-[#1A2642] overflow-hidden my-4">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: '#0D1421' }}>
            <th className="text-left px-4 py-2.5 font-mono text-xs text-slate-500 font-normal">Parameter</th>
            <th className="text-left px-4 py-2.5 font-mono text-xs text-slate-500 font-normal">Type</th>
            <th className="text-left px-4 py-2.5 font-mono text-xs text-slate-500 font-normal">Required</th>
            <th className="text-left px-4 py-2.5 font-mono text-xs text-slate-500 font-normal">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.name} style={{ background: i % 2 === 0 ? '#060B18' : '#070D1C', borderTop: '1px solid #1A2642' }}>
              <td className="px-4 py-2.5 font-mono text-xs" style={{ color: '#A5B4FC' }}>{row.name}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{row.type}</td>
              <td className="px-4 py-2.5 text-xs">{row.required ? <span style={{ color: '#F87171' }}>required</span> : <span className="text-slate-600">optional</span>}</td>
              <td className="px-4 py-2.5 text-xs text-slate-400">{row.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Callout({ type = 'info', children }: { type?: 'info' | 'warning' | 'tip'; children: React.ReactNode }) {
  const styles = {
    info:    { bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.25)', icon: 'ℹ', color: '#A5B4FC' },
    warning: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.25)', icon: '⚠', color: '#FCD34D' },
    tip:     { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.25)', icon: '✓', color: '#6EE7B7' },
  }[type];
  return (
    <div className="flex gap-3 rounded-xl px-4 py-3 my-4 border text-sm leading-relaxed" style={{ background: styles.bg, borderColor: styles.border }}>
      <span style={{ color: styles.color }}>{styles.icon}</span>
      <span className="text-slate-300">{children}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DocsPage() {
  const [activeId, setActiveId] = useState('introduction');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveId(e.target.id); });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    document.querySelectorAll('section[id]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ background: '#060B18', color: '#F1F5F9', minHeight: '100vh' }}>

      {/* ── Top nav ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50" style={{ background: 'rgba(6,11,24,0.92)', borderBottom: '1px solid #1A2642', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-mono font-bold text-white text-sm">BlueJoinet</Link>
            <span className="text-slate-700">/</span>
            <span className="text-sm text-slate-400">Documentation</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/playground" className="text-xs text-slate-400 hover:text-white transition-colors">Playground</Link>
            <Link href="/signup" className="text-xs text-white px-3 py-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              Get API key
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">

        {/* ── Sidebar ─────────────────────────────────── */}
        <aside className="hidden lg:block w-60 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-8 pr-4 pl-6 border-r border-[#1A2642]">
          {NAV.map((group) => (
            <div key={group.group} className="mb-6">
              <p className="font-mono text-xs text-slate-600 uppercase tracking-widest mb-2">{group.group}</p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="text-sm px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      color: activeId === item.id ? '#A5B4FC' : '#64748B',
                      background: activeId === item.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                      borderLeft: activeId === item.id ? '2px solid #6366F1' : '2px solid transparent',
                    }}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* ── Content ─────────────────────────────────── */}
        <main className="flex-1 min-w-0 px-8 py-10 max-w-3xl">

          {/* ── Introduction ───────────────────────────── */}
          <Section id="introduction">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-6 border" style={{ background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)', color: '#A5B4FC' }}>
              v1.0 — REST + WebSocket + Webhooks
            </div>
            <H2>Introduction</H2>
            <P>
              BlueJoinet is a Video Communication Infrastructure as a Service (VCaaS) platform. It gives your application a complete video call stack — REST API to create and manage calls, WebSocket events for real-time signaling, a hosted call UI your users land on directly, and webhook events for call lifecycle notifications.
            </P>
            <P>
              Your backend creates a call via the REST API. BlueJoinet returns two secure URLs — one for the caller, one for the receiver. Redirect each user to their URL. BlueJoinet handles everything else: signaling, WebRTC negotiation, TURN relay, the call UI, and media controls.
            </P>
            <Callout type="tip">
              Your users never know BlueJoinet exists. The call UI is hosted at your BlueJoinet domain and your brand is the only thing they see.
            </Callout>

            <H3>Base URL</H3>
            <CodeBlock code="https://api.yourdomain.com" title="API Base URL" />

            <H3>Key concepts</H3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
              {[
                { term: 'Project', def: 'A logical container. Each project gets its own API keys and call history.' },
                { term: 'API Key', def: 'A bj_live_... token. Sent by your backend to authenticate API requests.' },
                { term: 'CallSession', def: 'Created when you call POST /calls. Holds two participant tokens.' },
                { term: 'Session Token', def: 'A bj_session_... token. Sent by each participant to connect via WebSocket.' },
                { term: 'Caller URL', def: 'The hosted call UI URL for the person initiating the call.' },
                { term: 'Receiver URL', def: 'The hosted call UI URL for the person receiving the call.' },
              ].map((c) => (
                <div key={c.term} className="rounded-lg border border-[#1A2642] p-4" style={{ background: '#0D1421' }}>
                  <p className="font-mono text-xs mb-1" style={{ color: '#A5B4FC' }}>{c.term}</p>
                  <p className="text-xs text-slate-400">{c.def}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Quick Start ─────────────────────────────── */}
          <Section id="quickstart">
            <H2>Quick Start</H2>
            <P>Get a working video call in under 10 minutes.</P>

            <H3>Step 1 — Create an account and project</H3>
            <P>Sign up at BlueJoinet, create a project from the dashboard, and copy your API key (starts with <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: '#0D1421', color: '#A5B4FC' }}>bj_live_</code>).</P>

            <H3>Step 2 — Install the SDK (optional)</H3>
            <CodeBlock lang="bash" title="terminal" code={`npm install @bluejoinet/sdk`} />
            <P>Or use the REST API directly — no SDK required.</P>

            <H3>Step 3 — Create a call from your backend</H3>
            <CodeBlock title="your-server.js" code={`import BlueJoinet from '@bluejoinet/sdk';

const bj = new BlueJoinet({ apiKey: 'bj_live_your_key_here' });

// Call this from your backend when two users need to connect
const { callId, callerUrl, receiverUrl } = await bj.createCall({
  callerId: 'user_alice',
  receiverId: 'user_bob',
  type: 'VIDEO',
});

// Redirect each user to their URL
// Alice opens callerUrl, Bob opens receiverUrl
// That's it — BlueJoinet handles the rest`} />

            <H3>Step 4 — Redirect your users</H3>
            <P>
              Each URL is valid for one participant only. When Alice opens <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: '#0D1421', color: '#A5B4FC' }}>callerUrl</code>, she sees a dialing screen. When Bob opens <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: '#0D1421', color: '#A5B4FC' }}>receiverUrl</code>, he sees an incoming call notification. Both join the WebRTC call through the BlueJoinet hosted UI.
            </P>

            <Callout type="info">
              Never expose your <strong>bj_live_</strong> API key on the frontend. Always create calls from your server.
            </Callout>
          </Section>

          {/* ── Authentication ──────────────────────────── */}
          <Section id="authentication">
            <H2>Authentication</H2>
            <P>BlueJoinet uses three types of tokens depending on the context.</P>

            <div className="space-y-4 my-4">
              {[
                { prefix: 'bj_live_...', name: 'API Key', who: 'Your backend server', desc: 'Used to call the REST API. Created in the dashboard per project. Never expose this on the frontend.' },
                { prefix: 'bj_session_...', name: 'Session Token', who: 'Browser participants', desc: 'Returned inside callerUrl and receiverUrl. Used by the hosted call UI to authenticate the WebSocket connection.' },
                { prefix: 'JWT (Bearer)', name: 'Dashboard JWT', who: 'Dashboard users', desc: 'Issued on login. Used by the dashboard frontend to call /projects, /api-keys, and other management endpoints.' },
              ].map((t) => (
                <div key={t.name} className="rounded-xl border border-[#1A2642] p-5" style={{ background: '#0D1421' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <code className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: '#060B18', color: '#A5B4FC' }}>{t.prefix}</code>
                    <span className="font-semibold text-white text-sm">{t.name}</span>
                    <span className="text-xs text-slate-500">— {t.who}</span>
                  </div>
                  <p className="text-sm text-slate-400">{t.desc}</p>
                </div>
              ))}
            </div>

            <H3>Sending your API key</H3>
            <P>Pass the API key in the <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: '#0D1421', color: '#A5B4FC' }}>Authorization</code> header on every REST API request.</P>
            <CodeBlock title="HTTP header" code={`Authorization: Bearer bj_live_your_key_here`} />
          </Section>

          {/* ── Create Call ─────────────────────────────── */}
          <Section id="create-call">
            <H2>Create Call</H2>
            <div className="flex items-center gap-3 mb-4">
              <Method verb="POST" />
              <code className="font-mono text-sm text-slate-300">/calls</code>
            </div>
            <P>Creates a new call session. Returns two participant URLs — one for the caller, one for the receiver. Both URLs contain a single-use session token.</P>

            <H3>Request headers</H3>
            <ParamTable rows={[
              { name: 'Authorization', type: 'string', required: true, desc: 'Bearer bj_live_your_key_here' },
              { name: 'Content-Type', type: 'string', required: true, desc: 'application/json' },
            ]} />

            <H3>Request body</H3>
            <ParamTable rows={[
              { name: 'callerId', type: 'string', required: true, desc: 'Your internal identifier for the person initiating the call.' },
              { name: 'receiverId', type: 'string', required: true, desc: 'Your internal identifier for the person receiving the call.' },
              { name: 'type', type: '"VIDEO" | "AUDIO"', desc: 'Call type. Defaults to "VIDEO".' },
              { name: 'metadata', type: 'object', desc: 'Optional JSON object attached to the call. Returned in webhook events.' },
            ]} />

            <H3>Example request</H3>
            <CodeBlock title="cURL" code={`curl -X POST https://api.yourdomain.com/calls \\
  -H "Authorization: Bearer bj_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "callerId": "user_alice",
    "receiverId": "user_bob",
    "type": "VIDEO"
  }'`} />

            <H3>Response</H3>
            <CodeBlock title="200 OK" code={`{
  "callId": "clx8f2z...",
  "status": "PENDING",
  "type": "VIDEO",
  "callerUrl": "https://yourdomain.com/call?token=bj_session_...&callId=clx8f2z...",
  "receiverUrl": "https://yourdomain.com/call?token=bj_session_...&callId=clx8f2z...",
  "createdAt": "2026-08-01T10:00:00.000Z"
}`} />

            <Callout type="warning">
              Session tokens in the URLs are single-use and expire. Do not cache or reuse them across calls.
            </Callout>
          </Section>

          {/* ── Accept Call ─────────────────────────────── */}
          <Section id="accept-call">
            <H2>Accept Call</H2>
            <div className="flex items-center gap-3 mb-4">
              <Method verb="PATCH" />
              <code className="font-mono text-sm text-slate-300">/calls/:callId/accept</code>
            </div>
            <P>Marks a call as accepted. Typically triggered automatically by the hosted call UI when the receiver accepts. You can also call this from your backend.</P>

            <H3>Path parameters</H3>
            <ParamTable rows={[{ name: 'callId', type: 'string', required: true, desc: 'The ID returned when the call was created.' }]} />

            <H3>Example request</H3>
            <CodeBlock title="cURL" code={`curl -X PATCH https://api.yourdomain.com/calls/clx8f2z.../accept \\
  -H "Authorization: Bearer bj_live_your_key"`} />

            <H3>Response</H3>
            <CodeBlock title="200 OK" code={`{ "callId": "clx8f2z...", "status": "ACTIVE" }`} />
          </Section>

          {/* ── Reject Call ─────────────────────────────── */}
          <Section id="reject-call">
            <H2>Reject Call</H2>
            <div className="flex items-center gap-3 mb-4">
              <Method verb="PATCH" />
              <code className="font-mono text-sm text-slate-300">/calls/:callId/reject</code>
            </div>
            <P>Marks a call as rejected. The caller's UI is notified via WebSocket and the call session is closed.</P>

            <ParamTable rows={[{ name: 'callId', type: 'string', required: true, desc: 'The call ID to reject.' }]} />

            <CodeBlock title="cURL" code={`curl -X PATCH https://api.yourdomain.com/calls/clx8f2z.../reject \\
  -H "Authorization: Bearer bj_live_your_key"`} />

            <CodeBlock title="200 OK" code={`{ "callId": "clx8f2z...", "status": "REJECTED" }`} />
          </Section>

          {/* ── End Call ────────────────────────────────── */}
          <Section id="end-call">
            <H2>End Call</H2>
            <div className="flex items-center gap-3 mb-4">
              <Method verb="PATCH" />
              <code className="font-mono text-sm text-slate-300">/calls/:callId/end</code>
            </div>
            <P>Ends an active call. Both participants are notified via WebSocket. The call status changes to <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: '#0D1421', color: '#A5B4FC' }}>ENDED</code>.</P>

            <ParamTable rows={[{ name: 'callId', type: 'string', required: true, desc: 'The call ID to end.' }]} />

            <CodeBlock title="cURL" code={`curl -X PATCH https://api.yourdomain.com/calls/clx8f2z.../end \\
  -H "Authorization: Bearer bj_live_your_key"`} />

            <CodeBlock title="200 OK" code={`{ "callId": "clx8f2z...", "status": "ENDED" }`} />
          </Section>

          {/* ── Get Call ────────────────────────────────── */}
          <Section id="get-call">
            <H2>Get Call</H2>
            <div className="flex items-center gap-3 mb-4">
              <Method verb="GET" />
              <code className="font-mono text-sm text-slate-300">/calls/:callId</code>
            </div>
            <P>Retrieves the current state of a call session.</P>

            <CodeBlock title="cURL" code={`curl https://api.yourdomain.com/calls/clx8f2z... \\
  -H "Authorization: Bearer bj_live_your_key"`} />

            <CodeBlock title="200 OK" code={`{
  "callId": "clx8f2z...",
  "status": "ACTIVE",
  "type": "VIDEO",
  "callerId": "user_alice",
  "receiverId": "user_bob",
  "createdAt": "2026-08-01T10:00:00.000Z",
  "acceptedAt": "2026-08-01T10:00:15.000Z",
  "endedAt": null
}`} />

            <H3>Call status values</H3>
            <div className="flex flex-wrap gap-2 my-3">
              {[
                { s: 'PENDING', color: '#F59E0B' },
                { s: 'ACTIVE', color: '#10B981' },
                { s: 'ENDED', color: '#64748B' },
                { s: 'REJECTED', color: '#EF4444' },
                { s: 'MISSED', color: '#F87171' },
              ].map(({ s, color }) => <Badge key={s} color={color}>{s}</Badge>)}
            </div>
          </Section>

          {/* ── TURN Credentials ────────────────────────── */}
          <Section id="turn-credentials">
            <H2>TURN Credentials</H2>
            <div className="flex items-center gap-3 mb-4">
              <Method verb="GET" />
              <code className="font-mono text-sm text-slate-300">/calls/turn-credentials</code>
            </div>
            <P>Returns time-limited HMAC-SHA1 credentials for BlueJoinet's TURN server. The hosted call UI calls this automatically — you only need this endpoint if you are building a custom WebRTC integration.</P>

            <Callout type="info">
              Credentials expire after 1 hour. The TTL is set at generation time using RFC 5766 time-limited credential format.
            </Callout>

            <CodeBlock title="cURL" code={`curl https://api.yourdomain.com/calls/turn-credentials \\
  -H "Authorization: Bearer bj_session_your_token"`} />

            <CodeBlock title="200 OK" code={`{
  "iceServers": [
    { "urls": "stun:turn.yourdomain.com:3478" },
    {
      "urls": [
        "turn:turn.yourdomain.com:3478?transport=udp",
        "turn:turn.yourdomain.com:3478?transport=tcp",
        "turns:turn.yourdomain.com:5349?transport=tcp"
      ],
      "username": "1754000000:bluecall",
      "credential": "HMAC_SHA1_credential"
    }
  ]
}`} />
          </Section>

          {/* ── WebSocket Overview ──────────────────────── */}
          <Section id="ws-overview">
            <H2>WebSocket — Overview</H2>
            <P>BlueJoinet uses Socket.IO for real-time signaling. The hosted call UI connects automatically. If you are building a custom client, here is how the socket flow works.</P>

            <H3>Connect</H3>
            <CodeBlock title="browser" code={`import { io } from 'socket.io-client';

const socket = io('https://api.yourdomain.com', {
  auth: { token: 'bj_session_...' },  // session token from the URL
  transports: ['websocket'],
});

socket.on('connect', () => {
  // Authenticate with the call
  socket.emit('authenticate', { token: 'bj_session_...' });
});`} />

            <H3>Authentication flow</H3>
            <P>After connecting, emit <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: '#0D1421', color: '#A5B4FC' }}>authenticate</code> with the session token. The server verifies the token and:</P>
            <div className="space-y-2 my-3">
              {[
                'If this is the caller — waits for the receiver to connect, then emits incoming-call to the receiver.',
                'If this is the receiver — emits incoming-call to this socket immediately (caller is already waiting).',
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="shrink-0 mt-0.5 font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: '#0D1421', color: '#6366F1' }}>{i + 1}</span>
                  {s}
                </div>
              ))}
            </div>
          </Section>

          {/* ── incoming-call ───────────────────────────── */}
          <Section id="ws-incoming-call">
            <H2>incoming-call</H2>
            <P>Emitted to the receiver when the caller is ready. The receiver's UI uses this to display the incoming call notification.</P>
            <CodeBlock title="receiver socket" code={`socket.on('incoming-call', (data) => {
  console.log(data);
  // {
  //   callId: 'clx8f2z...',
  //   callerId: 'user_alice',
  //   type: 'VIDEO'
  // }

  // Show your incoming call UI here
  showIncomingCallUI(data);
});`} />
          </Section>

          {/* ── call-accepted ───────────────────────────── */}
          <Section id="ws-call-accepted">
            <H2>call-accepted</H2>
            <P>Emitted to the caller when the receiver accepts the call. At this point both participants start WebRTC negotiation.</P>
            <CodeBlock title="caller socket" code={`socket.on('call-accepted', async (data) => {
  // { callId: 'clx8f2z...' }

  // Begin WebRTC offer/answer exchange
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', { callId: data.callId, offer });
});`} />
          </Section>

          {/* ── call-rejected ───────────────────────────── */}
          <Section id="ws-call-rejected">
            <H2>call-rejected</H2>
            <P>Emitted to the caller when the receiver declines the call.</P>
            <CodeBlock title="caller socket" code={`socket.on('call-rejected', (data) => {
  // { callId: 'clx8f2z...' }
  showRejectedUI();
});`} />
          </Section>

          {/* ── call-ended ──────────────────────────────── */}
          <Section id="ws-call-ended">
            <H2>call-ended</H2>
            <P>Emitted to both participants when either side ends the call, or when <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: '#0D1421', color: '#A5B4FC' }}>PATCH /calls/:id/end</code> is called from your backend.</P>
            <CodeBlock title="both sockets" code={`socket.on('call-ended', (data) => {
  // { callId: 'clx8f2z...' }
  peerConnection.close();
  redirectToPostCallScreen();
});`} />
          </Section>

          {/* ── WebRTC Signaling ────────────────────────── */}
          <Section id="ws-signaling">
            <H2>WebRTC Signaling</H2>
            <P>BlueJoinet relays WebRTC offer/answer/ICE events between participants. The hosted call UI handles this automatically. Reference below if building a custom client.</P>

            <H3>Emit events (client → server)</H3>
            <CodeBlock code={`// Send offer (caller → server → receiver)
socket.emit('offer', { callId, offer: rtcSessionDescriptionInit });

// Send answer (receiver → server → caller)
socket.emit('answer', { callId, answer: rtcSessionDescriptionInit });

// Send ICE candidate (either direction)
socket.emit('ice-candidate', { callId, candidate: rtcIceCandidateInit });`} />

            <H3>Receive events (server → client)</H3>
            <CodeBlock code={`// Receiver gets the offer
socket.on('offer', async ({ offer }) => {
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', { callId, answer });
});

// Caller gets the answer
socket.on('answer', async ({ answer }) => {
  await peerConnection.setRemoteDescription(answer);
});

// Both sides exchange ICE candidates
socket.on('ice-candidate', async ({ candidate }) => {
  await peerConnection.addIceCandidate(candidate);
});`} />
          </Section>

          {/* ── Webhook Setup ───────────────────────────── */}
          <Section id="webhook-setup">
            <H2>Webhook Setup</H2>
            <P>BlueJoinet sends signed HTTP POST requests to your server when call state changes. Set up a webhook URL in the dashboard under your project settings.</P>

            <H3>Configure via dashboard</H3>
            <P>Go to Dashboard → your project → Webhook section → enter your endpoint URL → save. BlueJoinet generates a signing secret automatically.</P>

            <H3>Configure via API</H3>
            <CodeBlock title="cURL" code={`curl -X PATCH https://api.yourdomain.com/projects/your-project-id/webhook \\
  -H "Authorization: Bearer your-jwt-token" \\
  -H "Content-Type: application/json" \\
  -d '{ "webhookUrl": "https://yourapp.com/webhooks/bluejoinet" }'`} />

            <H3>Response</H3>
            <CodeBlock title="200 OK" code={`{
  "id": "proj_...",
  "webhookUrl": "https://yourapp.com/webhooks/bluejoinet",
  "webhookSecret": "64-char-hex-secret"
}`} />

            <Callout type="warning">
              Store the <strong>webhookSecret</strong> securely. It is shown only once. Use it to verify incoming webhook signatures.
            </Callout>
          </Section>

          {/* ── Webhook Events ──────────────────────────── */}
          <Section id="webhook-events">
            <H2>Webhook Events</H2>
            <P>BlueJoinet sends a POST request to your webhook URL on every call lifecycle change.</P>

            <div className="space-y-3 my-4">
              {[
                { event: 'call.created', when: 'A new call session is created via POST /calls.' },
                { event: 'call.accepted', when: 'The receiver accepts the call.' },
                { event: 'call.rejected', when: 'The receiver declines the call.' },
                { event: 'call.ended', when: 'Either participant ends the call, or PATCH /calls/:id/end is called.' },
              ].map((e) => (
                <div key={e.event} className="flex items-start gap-4 rounded-lg border border-[#1A2642] p-4" style={{ background: '#0D1421' }}>
                  <code className="font-mono text-xs shrink-0 mt-0.5 px-2 py-0.5 rounded" style={{ background: '#060B18', color: '#A5B4FC' }}>{e.event}</code>
                  <p className="text-sm text-slate-400">{e.when}</p>
                </div>
              ))}
            </div>

            <H3>Payload shape</H3>
            <CodeBlock title="POST https://yourapp.com/webhooks/bluejoinet" code={`{
  "event": "call.created",
  "callId": "clx8f2z...",
  "status": "PENDING",
  "callerId": "user_alice",
  "receiverId": "user_bob",
  "type": "VIDEO",
  "projectId": "proj_...",
  "timestamp": "2026-08-01T10:00:00.000Z"
}`} />

            <H3>Headers sent with every webhook</H3>
            <CodeBlock code={`X-BlueJoinet-Event: call.created
X-BlueJoinet-Signature: sha256=abcdef1234...
Content-Type: application/json`} />
          </Section>

          {/* ── Verify Signature ────────────────────────── */}
          <Section id="webhook-verify">
            <H2>Verify Signature</H2>
            <P>Every webhook request includes an <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: '#0D1421', color: '#A5B4FC' }}>X-BlueJoinet-Signature</code> header. Always verify this before processing the event.</P>

            <CodeBlock title="Node.js / Express" code={`import crypto from 'crypto';

app.post('/webhooks/bluejoinet', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-bluejoinet-signature'];
  const secret    = process.env.BLUEJOINET_WEBHOOK_SECRET;

  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(req.body)          // raw Buffer — do not parse before verifying
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body);

  switch (event.event) {
    case 'call.created':  handleCallCreated(event);  break;
    case 'call.accepted': handleCallAccepted(event); break;
    case 'call.rejected': handleCallRejected(event); break;
    case 'call.ended':    handleCallEnded(event);    break;
  }

  res.status(200).json({ received: true });
});`} />

            <Callout type="warning">
              Use <strong>express.raw()</strong> (not express.json()) to get the raw body for signature verification. Parsing JSON first changes the byte representation and will cause signature mismatches.
            </Callout>
          </Section>

          {/* ── SDK Install ─────────────────────────────── */}
          <Section id="sdk-install">
            <H2>SDK — Installation</H2>
            <P>The official BlueJoinet Node.js SDK wraps the REST API with TypeScript types and a simple interface.</P>
            <CodeBlock title="npm" code={`npm install @bluejoinet/sdk`} />
            <CodeBlock title="yarn" code={`yarn add @bluejoinet/sdk`} />
            <CodeBlock title="pnpm" code={`pnpm add @bluejoinet/sdk`} />

            <Callout type="tip">
              The SDK is optional. Every feature is available via plain HTTP. Use the SDK to skip writing boilerplate.
            </Callout>
          </Section>

          {/* ── SDK Init ────────────────────────────────── */}
          <Section id="sdk-init">
            <H2>SDK — Initialization</H2>
            <CodeBlock title="CommonJS" code={`const BlueJoinet = require('@bluejoinet/sdk');
const bj = new BlueJoinet({ apiKey: process.env.BLUEJOINET_API_KEY });`} />

            <CodeBlock title="ESM / TypeScript" code={`import BlueJoinet from '@bluejoinet/sdk';

const bj = new BlueJoinet({
  apiKey: process.env.BLUEJOINET_API_KEY,
  baseUrl: 'https://api.yourdomain.com',   // optional if using default
});`} />

            <ParamTable rows={[
              { name: 'apiKey', type: 'string', required: true, desc: 'Your bj_live_ API key from the dashboard.' },
              { name: 'baseUrl', type: 'string', desc: 'Override the API base URL. Useful for self-hosted deployments.' },
              { name: 'timeout', type: 'number', desc: 'Request timeout in milliseconds. Defaults to 10000.' },
            ]} />
          </Section>

          {/* ── SDK Methods ─────────────────────────────── */}
          <Section id="sdk-methods">
            <H2>SDK — Methods</H2>

            <H3>bj.createCall(options)</H3>
            <ParamTable rows={[
              { name: 'callerId', type: 'string', required: true, desc: 'Your internal ID for the caller.' },
              { name: 'receiverId', type: 'string', required: true, desc: 'Your internal ID for the receiver.' },
              { name: 'type', type: '"VIDEO" | "AUDIO"', desc: 'Defaults to "VIDEO".' },
              { name: 'metadata', type: 'object', desc: 'Optional data attached to the call.' },
            ]} />
            <CodeBlock code={`const { callId, callerUrl, receiverUrl } = await bj.createCall({
  callerId: 'user_alice',
  receiverId: 'user_bob',
});`} />

            <H3>bj.acceptCall(callId)</H3>
            <CodeBlock code={`const result = await bj.acceptCall('clx8f2z...');
// { callId: '...', status: 'ACTIVE' }`} />

            <H3>bj.rejectCall(callId)</H3>
            <CodeBlock code={`const result = await bj.rejectCall('clx8f2z...');
// { callId: '...', status: 'REJECTED' }`} />

            <H3>bj.endCall(callId)</H3>
            <CodeBlock code={`const result = await bj.endCall('clx8f2z...');
// { callId: '...', status: 'ENDED' }`} />

            <H3>bj.getCall(callId)</H3>
            <CodeBlock code={`const call = await bj.getCall('clx8f2z...');
// Full call object with status, timestamps, participant IDs`} />
          </Section>

          {/* ── Error Codes ─────────────────────────────── */}
          <Section id="error-codes">
            <H2>Error Codes</H2>
            <P>All errors return a JSON body with an <code className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: '#0D1421', color: '#A5B4FC' }}>error</code> field and an HTTP status code.</P>
            <CodeBlock title="Error response shape" code={`{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid or expired API key"
}`} />

            <div className="rounded-xl border border-[#1A2642] overflow-hidden my-4">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#0D1421' }}>
                    <th className="text-left px-4 py-2.5 font-mono text-xs text-slate-500 font-normal">Status</th>
                    <th className="text-left px-4 py-2.5 font-mono text-xs text-slate-500 font-normal">Meaning</th>
                    <th className="text-left px-4 py-2.5 font-mono text-xs text-slate-500 font-normal">Common cause</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { code: '400', label: 'Bad Request', cause: 'Missing required field in the request body.' },
                    { code: '401', label: 'Unauthorized', cause: 'Missing, invalid, or expired API key or session token.' },
                    { code: '403', label: 'Forbidden', cause: 'You do not own this resource.' },
                    { code: '404', label: 'Not Found', cause: 'callId does not exist or belongs to a different project.' },
                    { code: '409', label: 'Conflict', cause: 'Call is already in a terminal state (ENDED, REJECTED).' },
                    { code: '429', label: 'Too Many Requests', cause: 'Rate limit exceeded. Slow down requests.' },
                    { code: '500', label: 'Server Error', cause: 'Internal error. Contact support if it persists.' },
                  ].map((row, i) => (
                    <tr key={row.code} style={{ background: i % 2 === 0 ? '#060B18' : '#070D1C', borderTop: '1px solid #1A2642' }}>
                      <td className="px-4 py-2.5 font-mono text-xs" style={{ color: Number(row.code) >= 500 ? '#F87171' : Number(row.code) >= 400 ? '#FCD34D' : '#A5B4FC' }}>{row.code}</td>
                      <td className="px-4 py-2.5 text-xs text-white">{row.label}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-400">{row.cause}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── Debugging ───────────────────────────────── */}
          <Section id="debugging">
            <H2>Debugging Calls</H2>
            <P>When a call fails, BlueJoinet gives you three tools to diagnose the issue.</P>

            <H3>1. Call Inspector</H3>
            <P>Open the dashboard, click a call, and go to the Inspector tab. You will see codec, bitrate, latency, packet loss, and ICE state updated in real time.</P>

            <H3>2. Call Timeline</H3>
            <P>Every call generates a timeline of events: Created → Ringing → Accepted → Offer → Answer → ICE Connected → Media Started → Ended. If the call dropped, the timeline shows exactly where it stopped.</P>

            <H3>3. Common failure patterns</H3>
            <div className="space-y-4 my-4">
              {[
                {
                  title: 'ICE_FAILED — No route found',
                  cause: 'Both peers are behind strict NATs and STUN negotiation failed.',
                  fix: 'BlueJoinet\'s TURN server should handle this automatically. Verify TURN credentials are being fetched (check /turn-credentials response).',
                },
                {
                  title: 'WebSocket disconnects immediately after authenticate',
                  cause: 'Session token is invalid, expired, or used by the wrong participant.',
                  fix: 'Each URL (callerUrl, receiverUrl) contains a token for exactly one participant. Do not swap them.',
                },
                {
                  title: 'Offer sent but no answer received',
                  cause: 'The receiver\'s socket disconnected before completing negotiation.',
                  fix: 'Ensure the receiver\'s page stays loaded. Add reconnect logic in your custom client if needed.',
                },
                {
                  title: 'call-accepted fires but video never starts',
                  cause: 'Camera or microphone permissions not granted.',
                  fix: 'Request getUserMedia() permissions before the call starts. Handle NotAllowedError.',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-[#1A2642] p-5" style={{ background: '#0D1421' }}>
                  <p className="font-mono text-sm mb-2" style={{ color: '#FCD34D' }}>{item.title}</p>
                  <p className="text-xs text-slate-500 mb-1"><span className="text-slate-400">Cause:</span> {item.cause}</p>
                  <p className="text-xs text-slate-500"><span className="text-slate-400">Fix:</span> {item.fix}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Example Node.js ─────────────────────────── */}
          <Section id="example-nodejs">
            <H2>Example — Node.js / Express</H2>
            <P>A complete Express route that creates a video call and returns the URLs to your frontend.</P>
            <CodeBlock title="routes/call.js" code={`import express from 'express';
import BlueJoinet from '@bluejoinet/sdk';

const router = express.Router();
const bj = new BlueJoinet({ apiKey: process.env.BLUEJOINET_API_KEY });

// POST /api/call — called by your frontend when user clicks "Start call"
router.post('/call', async (req, res) => {
  const { callerId, receiverId } = req.body;

  if (!callerId || !receiverId) {
    return res.status(400).json({ error: 'callerId and receiverId are required' });
  }

  const { callId, callerUrl, receiverUrl } = await bj.createCall({
    callerId,
    receiverId,
    type: 'VIDEO',
  });

  // Return the URLs — your frontend redirects each user
  res.json({ callId, callerUrl, receiverUrl });
});

// PATCH /api/call/:callId/end — called when you want to force-end a call
router.patch('/call/:callId/end', async (req, res) => {
  const result = await bj.endCall(req.params.callId);
  res.json(result);
});

export default router;`} />
          </Section>

          {/* ── Example Python ──────────────────────────── */}
          <Section id="example-python">
            <H2>Example — Python / FastAPI</H2>
            <CodeBlock title="main.py" code={`import httpx
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()
API_KEY = os.environ["BLUEJOINET_API_KEY"]
BASE_URL = "https://api.yourdomain.com"

class CreateCallRequest(BaseModel):
    caller_id: str
    receiver_id: str

@app.post("/call")
async def create_call(body: CreateCallRequest):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/calls",
            headers={"Authorization": f"Bearer {API_KEY}"},
            json={
                "callerId": body.caller_id,
                "receiverId": body.receiver_id,
                "type": "VIDEO",
            },
        )

    if response.status_code != 201:
        raise HTTPException(status_code=response.status_code, detail=response.json())

    data = response.json()
    return {
        "call_id": data["callId"],
        "caller_url": data["callerUrl"],
        "receiver_url": data["receiverUrl"],
    }

@app.patch("/call/{call_id}/end")
async def end_call(call_id: str):
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{BASE_URL}/calls/{call_id}/end",
            headers={"Authorization": f"Bearer {API_KEY}"},
        )
    return response.json()`} />
          </Section>

          {/* ── Example cURL ────────────────────────────── */}
          <Section id="example-curl">
            <H2>Example — cURL</H2>
            <P>All API calls in cURL — useful for testing or scripting.</P>

            <H3>Create a call</H3>
            <CodeBlock title="terminal" code={`curl -X POST https://api.yourdomain.com/calls \\
  -H "Authorization: Bearer bj_live_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"callerId":"user_alice","receiverId":"user_bob","type":"VIDEO"}'`} />

            <H3>End a call</H3>
            <CodeBlock title="terminal" code={`curl -X PATCH https://api.yourdomain.com/calls/CALL_ID/end \\
  -H "Authorization: Bearer bj_live_your_key"`} />

            <H3>Get call status</H3>
            <CodeBlock title="terminal" code={`curl https://api.yourdomain.com/calls/CALL_ID \\
  -H "Authorization: Bearer bj_live_your_key"`} />

            <H3>Set webhook URL</H3>
            <CodeBlock title="terminal" code={`curl -X PATCH https://api.yourdomain.com/projects/PROJECT_ID/webhook \\
  -H "Authorization: Bearer your-jwt-token" \\
  -H "Content-Type: application/json" \\
  -d '{"webhookUrl":"https://yourapp.com/webhooks/bluejoinet"}'`} />

            {/* Final CTA */}
            <div className="mt-12 rounded-xl p-8 text-center border border-[#2A3D64]" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))' }}>
              <p className="font-bold text-white mb-2" style={{ fontSize: '1.25rem' }}>Ready to build?</p>
              <p className="text-slate-400 text-sm mb-6">Create a free account and get your API key in under a minute.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/signup" className="inline-flex items-center gap-2 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                  Get API key →
                </Link>
                <Link href="/dashboard/playground" className="inline-flex items-center gap-2 text-slate-300 font-medium text-sm px-6 py-2.5 rounded-lg border border-[#1A2642] hover:border-[#2A3D64] transition-all">
                  Try playground
                </Link>
              </div>
            </div>
          </Section>

        </main>
      </div>
    </div>
  );
}
