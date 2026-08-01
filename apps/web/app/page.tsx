import Link from 'next/link';

const USE_CASES = [
  {
    icon: '🎯',
    label: 'HR & Recruitment',
    description: 'Interview candidates inside your hiring platform. No third-party meeting links, no context switching.',
  },
  {
    icon: '🏥',
    label: 'Telemedicine',
    description: 'Doctor-patient consultations embedded in your healthcare product. Secure, compliant, and seamless.',
  },
  {
    icon: '💼',
    label: 'CRM & Sales',
    description: 'Call leads without leaving the CRM. Call records attach to the contact automatically.',
  },
  {
    icon: '🎧',
    label: 'Customer Support',
    description: 'Agents connect to customers instantly — no hold music, no plugin downloads required.',
  },
  {
    icon: '📚',
    label: 'EdTech',
    description: 'Live tutoring and classes built into your learning platform. Students never leave your product.',
  },
  {
    icon: '🛒',
    label: 'Marketplace',
    description: 'Buyers and sellers meet face-to-face inside your platform before any transaction.',
  },
];

const FEATURES = [
  { title: 'Audio & Video Calls', body: '1-to-1 audio and video over peer-to-peer WebRTC. Low latency, no monthly media bill.' },
  { title: 'Screen Sharing', body: 'Share a desktop or application window mid-call — no extra integration required.' },
  { title: 'Hosted Call UI', body: 'A ready-made call page at a URL you control. No frontend SDK, no React dependency.' },
  { title: 'REST API', body: 'Create, accept, reject, and end calls with plain HTTP. Any language, any framework.' },
  { title: 'WebSocket Signaling', body: 'Real-time call events — incoming call, offer, answer, ICE — handled server-side.' },
  { title: 'Webhook Events', body: 'Receive signed HTTP POSTs when call state changes. HMAC-SHA256 verified.' },
  { title: 'Per-project API Keys', body: 'Isolate credentials per product or environment. Rotate without downtime.' },
  { title: 'TURN Relay', body: 'Built-in TURN server for calls behind strict firewalls. Time-limited HMAC credentials.' },
  { title: 'Node.js SDK', body: 'Optional npm package that wraps the REST API. Type-safe, zero config, one import.' },
];

const STEPS = [
  {
    step: 'Create a call',
    body: 'Your backend sends POST /calls with a caller ID and receiver ID. BlueJoinet returns a secure token for each participant.',
  },
  {
    step: 'Redirect your users',
    body: "Send each participant to the BlueJoinet hosted URL with their token. That's the only frontend work you do.",
  },
  {
    step: 'BlueJoinet takes over',
    body: 'Signaling, WebRTC negotiation, media controls, screen sharing, and the call UI — all handled.',
  },
];

const DASHBOARD_FEATURES = [
  { icon: '📞', label: 'Active Calls', desc: 'See every live call in your project in real time.' },
  { icon: '📋', label: 'Call History', desc: 'Full log of every call with timestamps and outcomes.' },
  { icon: '📊', label: 'API Usage', desc: 'Track request volume, error rates, and quota across projects.' },
  { icon: '✅', label: 'Call Success Rate', desc: 'Know at a glance if your integration is healthy.' },
  { icon: '🐛', label: 'Error Reports', desc: 'Pinpoint failures with structured error details per call.' },
  { icon: '🔴', label: 'Live Sessions', desc: 'Monitor active participants and connection states.' },
  { icon: '🗂', label: 'Debug Logs', desc: 'Structured signaling and event logs per call.' },
  { icon: '🌐', label: 'Network Info', desc: 'ICE state, TURN relay usage, codec, and bitrate per call.' },
];

const ROADMAP_MODULES = [
  { icon: '🎤', label: 'Audio Calls', status: 'planned' },
  { icon: '🎥', label: 'Video Calls', status: 'live' },
  { icon: '🖥', label: 'Screen Sharing', status: 'live' },
  { icon: '💬', label: 'Chat', status: 'planned' },
  { icon: '🔔', label: 'Push Notifications', status: 'planned' },
  { icon: '📧', label: 'Email', status: 'planned' },
  { icon: '📱', label: 'SMS', status: 'planned' },
  { icon: '🟢', label: 'Presence', status: 'planned' },
  { icon: '⏺', label: 'Recording', status: 'planned' },
];

const TIMELINE_EVENTS = [
  { label: 'Call Created', color: '#6366F1' },
  { label: 'Ringing', color: '#8B5CF6' },
  { label: 'Accepted', color: '#A78BFA' },
  { label: 'Offer Sent', color: '#6366F1' },
  { label: 'Answer Received', color: '#8B5CF6' },
  { label: 'ICE Connected', color: '#10B981' },
  { label: 'Media Started', color: '#10B981' },
  { label: 'Call Ended', color: '#64748B' },
];

const SUPPORT_ITEMS = [
  { icon: '⚡', title: 'Fast Response', body: 'Technical engineers respond to issues quickly — not marketing bots.' },
  { icon: '📖', title: 'Helpful Docs', body: 'Docs are treated as a product. Quick start, copy buttons, interactive examples.' },
  { icon: '🛠', title: 'SDK Examples', body: 'Working code in Node.js, Python, Go, and more — drop it in and it works.' },
  { icon: '🌍', title: 'Community', body: 'Developer community where you can ask questions and share integrations.' },
];

export default function LandingPage() {
  return (
    <div style={{ background: '#060B18', color: '#F1F5F9' }}>

      {/* ── Nav ──────────────────────────────────────────── */}
      <header
        style={{ background: 'rgba(6,11,24,0.85)', borderBottom: '1px solid #1A2642', backdropFilter: 'blur(12px)' }}
        className="sticky top-0 z-50"
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-mono font-bold text-white tracking-tight text-base">BlueJoinet</span>
          <nav className="flex items-center gap-6">
            <a href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</a>
            <a href="#debugging" className="text-sm text-slate-400 hover:text-white transition-colors">Debugging</a>
            <Link href="/docs" className="text-sm text-slate-400 hover:text-white transition-colors">Docs</Link>
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Log in</Link>
            <Link
              href="/signup"
              className="text-sm text-white px-4 py-1.5 rounded-lg transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative pt-24 pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute" style={{ top: '-20%', left: '30%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)' }} />
          <div className="absolute" style={{ top: '10%', left: '50%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)' }} />
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-8 border" style={{ background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)', color: '#A5B4FC' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#6366F1' }} />
            No per-minute pricing &nbsp;·&nbsp; No complex setup &nbsp;·&nbsp; Startup-first
          </div>

          <h1 className="font-bold text-white leading-tight mb-6" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', letterSpacing: '-0.03em', textWrap: 'balance' }}>
            Add video calls to your product
            <br />
            <span style={{ background: 'linear-gradient(135deg, #818CF8, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              in minutes, not weeks.
            </span>
          </h1>

          <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-2xl" style={{ textWrap: 'balance' }}>
            Two API calls. A hosted call UI. No frontend SDK. No per-minute billing.
            BlueJoinet is the communication infrastructure built specifically for startups — simple to integrate, affordable to scale, and powerful enough to debug when something goes wrong.
          </p>

          <div className="flex flex-wrap gap-4 mb-16">
            <Link href="/signup" className="inline-flex items-center gap-2 text-white font-medium text-sm px-6 py-3 rounded-lg transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              Start building <span>→</span>
            </Link>
            <Link href="/dashboard" className="inline-flex items-center gap-2 font-medium text-sm px-6 py-3 rounded-lg transition-all hover:border-slate-500 hover:text-white text-slate-300 border border-[#1A2642]" style={{ background: '#0D1421' }}>
              Open dashboard
            </Link>
          </div>

          {/* Code snippet — point 2: Extremely easy integration */}
          <div className="max-w-2xl rounded-xl overflow-hidden border border-[#1A2642]" style={{ background: '#0A1020' }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A2642]">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              <span className="font-mono text-slate-500 text-xs ml-2">your-server.js</span>
              <span className="ml-auto text-xs text-slate-600 font-mono">integration takes minutes, not days</span>
            </div>
            <pre className="font-mono text-sm px-5 py-5 overflow-x-auto" style={{ lineHeight: '1.8' }}>
              <span style={{ color: '#64748B' }}>{`// 1. Create a call from your backend\n`}</span>
              <span style={{ color: '#7DD3FC' }}>{'const '}</span>
              <span style={{ color: '#F1F5F9' }}>{'{ callerUrl, receiverUrl } = '}</span>
              <span style={{ color: '#C4B5FD' }}>{'await '}</span>
              <span style={{ color: '#F1F5F9' }}>{'BlueJoinet.'}</span>
              <span style={{ color: '#86EFAC' }}>{'createCall'}</span>
              <span style={{ color: '#F1F5F9' }}>{'({ callerId, receiverId })\n\n'}</span>
              <span style={{ color: '#64748B' }}>{`// 2. Redirect each user — you're done\n`}</span>
              <span style={{ color: '#C4B5FD' }}>{'redirect'}</span>
              <span style={{ color: '#F1F5F9' }}>{`(caller, callerUrl)\n`}</span>
              <span style={{ color: '#C4B5FD' }}>{'redirect'}</span>
              <span style={{ color: '#F1F5F9' }}>{`(receiver, receiverUrl)`}</span>
            </pre>
          </div>
        </div>
      </section>

      {/* ── Why BlueJoinet (problem / solution) ──────────── */}
      <section className="py-24 px-6" style={{ background: '#080E1C' }}>
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: '#818CF8' }}>Why BlueJoinet</p>
          <h2 className="font-bold text-white mb-4" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', letterSpacing: '-0.02em', textWrap: 'balance' }}>
            Current platforms were not built for startups
          </h2>
          <p className="text-slate-400 mb-14 max-w-2xl">
            Enterprise communication tools are powerful but expensive, complex, and loaded with features you never use. BlueJoinet is different.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Problem */}
            <div className="rounded-xl border border-red-900/30 p-8" style={{ background: 'linear-gradient(135deg, #1a0a0a 0%, #0D1421 100%)' }}>
              <p className="font-mono text-xs tracking-widest uppercase mb-6" style={{ color: '#F87171' }}>The problem today</p>
              <div className="space-y-3">
                {['Expensive per-minute or per-message pricing', 'Confusing pricing calculators with hidden fees', 'Enterprise-only documentation', 'Complex SDKs that take weeks to integrate', 'Generic error messages with no debugging context', 'Overloaded dashboards built for large ops teams'].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="text-red-500 mt-0.5 text-sm">✕</span>
                    <p className="text-sm text-slate-400">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Solution */}
            <div className="rounded-xl border border-[#2A3D64] p-8" style={{ background: 'linear-gradient(135deg, #0D1421 0%, #111827 100%)' }}>
              <p className="font-mono text-xs tracking-widest uppercase mb-6" style={{ color: '#818CF8' }}>The BlueJoinet way</p>
              <div className="space-y-3">
                {['Predictable flat pricing — you always know what you pay', 'No hidden fees, no confusing calculators', 'Documentation treated as a product', 'Integration in minutes, not days', 'Full call inspector with root-cause diagnostics', 'Developer-first dashboard with tools you actually use'].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="text-green-400 mt-0.5 text-sm">✓</span>
                    <p className="text-sm text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Use cases ────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: '#060B18' }}>
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: '#818CF8' }}>Who it&apos;s for</p>
          <h2 className="font-bold text-white mb-4" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', letterSpacing: '-0.02em', textWrap: 'balance' }}>
            Any product that needs real-time video between two people
          </h2>
          <p className="text-slate-400 mb-14 max-w-2xl">
            BlueJoinet is B2B infrastructure. Your customers never know it exists — it just works, invisibly, inside your product.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {USE_CASES.map((uc) => (
              <div key={uc.label} className="rounded-xl border border-[#1A2642] p-6 transition-all hover:border-[#2A3D64]" style={{ background: 'linear-gradient(135deg, #0D1421 0%, #111827 100%)' }}>
                <div className="text-2xl mb-4">{uc.icon}</div>
                <p className="font-semibold text-white mb-2 text-sm">{uc.label}</p>
                <p className="text-sm text-slate-400 leading-relaxed">{uc.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: '#080E1C' }}>
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: '#818CF8' }}>How it works</p>
          <h2 className="font-bold text-white mb-16" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', letterSpacing: '-0.02em' }}>
            Three steps, then it&apos;s running
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((item, i) => (
              <div key={item.step} className="relative rounded-xl border border-[#1A2642] p-6" style={{ background: '#0D1421' }}>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg font-mono font-bold text-sm mb-5 text-white" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                  {i + 1}
                </div>
                <p className="font-semibold text-white mb-2">{item.step}</p>
                <p className="text-sm text-slate-400 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: '#060B18' }}>
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: '#818CF8' }}>What you get</p>
          <h2 className="font-bold text-white mb-14" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', letterSpacing: '-0.02em' }}>
            Everything in the box
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: '#1A2642' }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6" style={{ background: '#060B18' }}>
                <div className="w-1 h-4 rounded-full mb-4" style={{ background: 'linear-gradient(180deg, #6366F1, #8B5CF6)' }} />
                <p className="font-semibold text-white text-sm mb-2">{f.title}</p>
                <p className="text-sm text-slate-400 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Developer Dashboard (point 3) ────────────────── */}
      <section className="py-24 px-6" style={{ background: '#080E1C' }}>
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: '#818CF8' }}>Dashboard</p>
          <h2 className="font-bold text-white mb-4" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', letterSpacing: '-0.02em', textWrap: 'balance' }}>
            A dashboard built for developers, not managers
          </h2>
          <p className="text-slate-400 mb-14 max-w-2xl">
            Instead of only analytics, BlueJoinet gives you tools you actually reach for when something breaks.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DASHBOARD_FEATURES.map((item) => (
              <div key={item.label} className="rounded-xl border border-[#1A2642] p-5 transition-all hover:border-[#2A3D64]" style={{ background: '#0D1421' }}>
                <div className="text-xl mb-3">{item.icon}</div>
                <p className="font-semibold text-white text-sm mb-1">{item.label}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Debugging Tools (points 5, 7, 8) ─────────────── */}
      <section id="debugging" className="py-24 px-6" style={{ background: '#060B18' }}>
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: '#818CF8' }}>Debugging</p>
          <h2 className="font-bold text-white mb-4" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', letterSpacing: '-0.02em', textWrap: 'balance' }}>
            Know exactly why a call failed
          </h2>
          <p className="text-slate-400 mb-16 max-w-2xl">
            One of the biggest problems with real-time communication is debugging failures. BlueJoinet gives you a complete call inspector, a call timeline, and session replay — so you spend minutes debugging, not hours.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

            {/* Call Inspector */}
            <div className="rounded-xl border border-[#1A2642] overflow-hidden" style={{ background: '#0D1421' }}>
              <div className="px-6 py-4 border-b border-[#1A2642]">
                <p className="font-mono text-xs tracking-widest uppercase" style={{ color: '#818CF8' }}>Point 5 — Call Inspector</p>
                <p className="font-semibold text-white mt-1">Real-time call diagnostics</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Call Status', value: 'Connected', color: '#10B981' },
                    { label: 'Codec', value: 'VP8 / Opus', color: '#A5B4FC' },
                    { label: 'Bitrate', value: '2.1 Mbps', color: '#A5B4FC' },
                    { label: 'Latency', value: '42 ms', color: '#10B981' },
                    { label: 'Packet Loss', value: '0.2%', color: '#10B981' },
                    { label: 'ICE Connection', value: 'Relay (TURN)', color: '#A5B4FC' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg p-3 border border-[#1A2642]" style={{ background: '#060B18' }}>
                      <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                      <p className="text-sm font-mono font-semibold" style={{ color: stat.color }}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-600 mt-4">This view saves developers hours of debugging failed calls.</p>
              </div>
            </div>

            {/* Call Timeline + Session Replay stacked */}
            <div className="flex flex-col gap-6">

              {/* Call Timeline (point 7) */}
              <div className="rounded-xl border border-[#1A2642] overflow-hidden flex-1" style={{ background: '#0D1421' }}>
                <div className="px-6 py-4 border-b border-[#1A2642]">
                  <p className="font-mono text-xs tracking-widest uppercase" style={{ color: '#818CF8' }}>Point 7 — Call Timeline</p>
                  <p className="font-semibold text-white mt-1">Every event, in order</p>
                </div>
                <div className="px-6 py-5">
                  <div className="flex flex-col gap-0">
                    {TIMELINE_EVENTS.map((event, i) => (
                      <div key={event.label} className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: event.color }} />
                          {i < TIMELINE_EVENTS.length - 1 && <div className="w-px h-4" style={{ background: '#1A2642' }} />}
                        </div>
                        <p className="text-xs text-slate-400 py-1">{event.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Session Replay (point 8) */}
              <div className="rounded-xl border border-[#1A2642] overflow-hidden" style={{ background: '#0D1421' }}>
                <div className="px-6 py-4 border-b border-[#1A2642]">
                  <p className="font-mono text-xs tracking-widest uppercase" style={{ color: '#818CF8' }}>Point 8 — Session Replay</p>
                  <p className="font-semibold text-white mt-1">Replay signaling events</p>
                </div>
                <div className="px-6 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {['Offer →', 'Answer →', 'ICE Candidate →', 'Connected →', 'Disconnected'].map((ev) => (
                      <span key={ev} className="text-xs font-mono px-2 py-1 rounded border border-[#2A3D64]" style={{ background: '#060B18', color: '#A5B4FC' }}>{ev}</span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                    Not video playback — protocol replay. See the exact signaling sequence of any past call. Perfect for reproducing edge-case failures.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Diagnostics teaser (point 6) */}
          <div className="rounded-xl border border-[#2A3D64] p-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0D1421 0%, #111827 100%)' }}>
            <div className="absolute top-4 right-4 text-xs font-mono px-2 py-0.5 rounded border" style={{ background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)', color: '#A5B4FC' }}>Coming soon</div>
            <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: '#818CF8' }}>Point 6 — AI Call Diagnostics</p>
            <h3 className="font-semibold text-white mb-4">From cryptic errors to clear explanations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-500 mb-2 font-mono">WITHOUT AI diagnostics</p>
                <div className="rounded-lg p-4 border border-red-900/30 font-mono text-sm" style={{ background: '#1a0a0a', color: '#F87171' }}>
                  ICE_FAILED
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2 font-mono">WITH AI diagnostics</p>
                <div className="rounded-lg p-4 border border-[#1A2642] text-sm" style={{ background: '#060B18' }}>
                  <p className="text-white font-medium mb-1">Connection failed.</p>
                  <p className="text-slate-400 text-xs mb-2">Reason: Symmetric NAT detected. TURN relay unavailable.</p>
                  <p className="text-xs font-mono" style={{ color: '#86EFAC' }}>→ Deploy TURN server closer to user region.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live Playground (point 9) ─────────────────────── */}
      <section className="py-24 px-6" style={{ background: '#080E1C' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: '#818CF8' }}>Live Playground</p>
              <h2 className="font-bold text-white mb-4" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', letterSpacing: '-0.02em', textWrap: 'balance' }}>
                Test everything without writing a line of code
              </h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                BlueJoinet ships with an online playground. Create a call, open two browser tabs, start the call — see everything working before you write a single line of integration code. Increases confidence before you ship.
              </p>
              <Link href="/dashboard/playground" className="inline-flex items-center gap-2 text-white font-medium text-sm px-6 py-3 rounded-lg transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                Open playground →
              </Link>
            </div>

            <div className="rounded-xl border border-[#1A2642] overflow-hidden" style={{ background: '#0D1421' }}>
              <div className="px-5 py-4 border-b border-[#1A2642] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: '#6366F1' }} />
                <span className="text-xs text-slate-400 font-mono">BlueJoinet Playground</span>
              </div>
              <div className="p-6">
                <div className="flex flex-col gap-3">
                  {[
                    { step: '1', label: 'Click "Create Call"', done: true },
                    { step: '2', label: 'Two URLs appear — caller + receiver', done: true },
                    { step: '3', label: 'Open each in a browser tab', done: true },
                    { step: '4', label: 'Video call starts immediately', done: false },
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0" style={{ background: item.done ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : '#1A2642', color: item.done ? 'white' : '#475569' }}>
                        {item.done ? '✓' : item.step}
                      </div>
                      <p className="text-sm" style={{ color: item.done ? '#F1F5F9' : '#64748B' }}>{item.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-lg p-3 border border-[#1A2642] text-center text-xs text-slate-500 font-mono" style={{ background: '#060B18' }}>
                  No API key required. No code required.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Communication Platform Roadmap (point 4) ──────── */}
      <section className="py-24 px-6" style={{ background: '#060B18' }}>
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: '#818CF8' }}>Platform Roadmap</p>
          <h2 className="font-bold text-white mb-4" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', letterSpacing: '-0.02em', textWrap: 'balance' }}>
            One API. One dashboard. One billing system.
          </h2>
          <p className="text-slate-400 mb-14 max-w-2xl">
            BlueJoinet is growing into a complete communication platform. Every module is built on the same API surface and appears in the same dashboard — no extra accounts, no extra billing.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ROADMAP_MODULES.map((m) => (
              <div key={m.label} className="rounded-xl border p-4 text-center transition-all" style={{ background: m.status === 'live' ? 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.08))' : '#0D1421', borderColor: m.status === 'live' ? 'rgba(99,102,241,0.4)' : '#1A2642', opacity: m.status === 'live' ? 1 : 0.6 }}>
                <div className="text-2xl mb-2">{m.icon}</div>
                <p className="text-xs font-semibold text-white mb-1">{m.label}</p>
                <span className="text-xs font-mono" style={{ color: m.status === 'live' ? '#86EFAC' : '#475569' }}>
                  {m.status === 'live' ? '● live' : '○ planned'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Transparent Pricing (points 1 & 11) ──────────── */}
      <section id="pricing" className="py-24 px-6" style={{ background: '#080E1C' }}>
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: '#818CF8' }}>Pricing</p>
          <h2 className="font-bold text-white mb-4" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', letterSpacing: '-0.02em', textWrap: 'balance' }}>
            Transparent pricing. No surprises.
          </h2>
          <p className="text-slate-400 mb-14 max-w-2xl">
            You understand our pricing within one minute. No confusing calculators, no hidden fees, no enterprise-only information. Customers always know what they will pay.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="rounded-xl border border-[#1A2642] p-8" style={{ background: '#0D1421' }}>
              <p className="font-semibold text-white mb-1">Starter</p>
              <p className="text-slate-400 text-sm mb-6">Perfect for early-stage startups</p>
              <p className="font-bold text-white mb-1" style={{ fontSize: '2rem' }}>Free</p>
              <p className="text-xs text-slate-500 mb-8">No credit card required</p>
              <div className="space-y-3 mb-8">
                {['Included call minutes', 'Unlimited projects', 'Unlimited team members', 'REST API + WebSocket', 'Hosted call UI', 'No hidden charges'].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: '#6366F1' }}>✓</span>
                    <p className="text-sm text-slate-400">{f}</p>
                  </div>
                ))}
              </div>
              <Link href="/signup" className="block text-center text-sm font-medium text-white px-4 py-2.5 rounded-lg transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                Get started free
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-xl border border-[#2A3D64] p-8 relative" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))', boxShadow: '0 0 40px rgba(99,102,241,0.08)' }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-mono px-3 py-0.5 rounded-full border" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', borderColor: 'transparent', color: 'white' }}>Most popular</div>
              <p className="font-semibold text-white mb-1">Growth</p>
              <p className="text-slate-400 text-sm mb-6">For growing SaaS products</p>
              <p className="font-bold text-white mb-1" style={{ fontSize: '2rem' }}>Coming soon</p>
              <p className="text-xs text-slate-500 mb-8">Predictable monthly flat rate</p>
              <div className="space-y-3 mb-8">
                {['Everything in Starter', 'More call minutes', 'Call Inspector + Timeline', 'Session Replay', 'Webhook events', 'Priority support'].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: '#818CF8' }}>✓</span>
                    <p className="text-sm text-slate-300">{f}</p>
                  </div>
                ))}
              </div>
              <button disabled className="block w-full text-center text-sm font-medium text-slate-500 px-4 py-2.5 rounded-lg border border-[#1A2642] cursor-not-allowed">
                Join waitlist
              </button>
            </div>

            {/* Enterprise */}
            <div className="rounded-xl border border-[#1A2642] p-8" style={{ background: '#0D1421' }}>
              <p className="font-semibold text-white mb-1">Scale</p>
              <p className="text-slate-400 text-sm mb-6">For high-volume products</p>
              <p className="font-bold text-white mb-1" style={{ fontSize: '2rem' }}>Custom</p>
              <p className="text-xs text-slate-500 mb-8">Volume pricing, SLA, dedicated support</p>
              <div className="space-y-3 mb-8">
                {['Everything in Growth', 'Custom call minute packages', 'Dedicated infrastructure', 'SLA guarantees', 'Custom integrations', 'Technical account manager'].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: '#6366F1' }}>✓</span>
                    <p className="text-sm text-slate-400">{f}</p>
                  </div>
                ))}
              </div>
              <a href="mailto:hello@bluejoinet.com" className="block text-center text-sm font-medium text-white px-4 py-2.5 rounded-lg border border-[#1A2642] hover:border-[#2A3D64] transition-all">
                Talk to us
              </a>
            </div>
          </div>

          <p className="text-center text-xs text-slate-600 mt-8">No confusing pricing calculators. No feature paywalls buried in footnotes. What you see is what you pay.</p>
        </div>
      </section>

      {/* ── Documentation (point 10) ──────────────────────── */}
      <section className="py-24 px-6" style={{ background: '#060B18' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Doc preview mockup */}
            <div className="rounded-xl border border-[#1A2642] overflow-hidden order-2 lg:order-1" style={{ background: '#0D1421' }}>
              <div className="px-5 py-3 border-b border-[#1A2642] flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400">Quick Start</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>Dark mode</span>
              </div>
              <div className="p-5 space-y-4">
                {[
                  { section: '1. Install the SDK', content: 'npm install @bluejoinet/sdk', isCode: true },
                  { section: '2. Initialize', content: 'const bj = new BlueJoinet({ apiKey })', isCode: true },
                  { section: '3. Create your first call', content: 'const { callerUrl, receiverUrl } = await bj.createCall({ callerId, receiverId })', isCode: true },
                ].map((item) => (
                  <div key={item.section}>
                    <p className="text-xs text-slate-500 mb-2">{item.section}</p>
                    <div className="rounded-lg p-3 font-mono text-xs border border-[#1A2642] flex items-center justify-between gap-4" style={{ background: '#060B18', color: '#A5B4FC' }}>
                      <span className="truncate">{item.content}</span>
                      <span className="text-slate-600 shrink-0 cursor-pointer hover:text-slate-400 transition-colors">copy</span>
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 pt-2">
                  {['API Explorer', 'Error Reference', 'Webhooks', 'SDK Docs'].map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded border border-[#1A2642] text-slate-500 font-mono">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: '#818CF8' }}>Documentation</p>
              <h2 className="font-bold text-white mb-4" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', letterSpacing: '-0.02em', textWrap: 'balance' }}>
                Docs treated as a product
              </h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Not an afterthought. BlueJoinet documentation includes everything developers need to move fast — without filing a support ticket.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '⚡', label: 'Quick Start', desc: 'Working in minutes' },
                  { icon: '📋', label: 'Copy Buttons', desc: 'Every snippet' },
                  { icon: '🌐', label: 'API Explorer', desc: 'Try APIs inline' },
                  { icon: '🔍', label: 'Error Explanations', desc: 'Root cause, not codes' },
                  { icon: '🌙', label: 'Dark Mode', desc: 'Comfortable reading' },
                  { icon: '🌍', label: 'Multiple Languages', desc: 'Node, Python, Go, more' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-2.5">
                    <span className="text-sm mt-0.5">{item.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Fast Customer Support (point 12) ─────────────── */}
      <section className="py-24 px-6" style={{ background: '#080E1C' }}>
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: '#818CF8' }}>Support</p>
          <h2 className="font-bold text-white mb-4" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', letterSpacing: '-0.02em', textWrap: 'balance' }}>
            Developers appreciate fast answers more than marketing
          </h2>
          <p className="text-slate-400 mb-14 max-w-2xl">
            When something breaks at 2am, you need a real answer from a technical person — not a chatbot pointing to the FAQ.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUPPORT_ITEMS.map((item) => (
              <div key={item.title} className="rounded-xl border border-[#1A2642] p-6 transition-all hover:border-[#2A3D64]" style={{ background: '#0D1421' }}>
                <div className="text-2xl mb-4">{item.icon}</div>
                <p className="font-semibold text-white text-sm mb-2">{item.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #1e1b4b 100%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.08) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="font-bold text-white mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.02em', textWrap: 'balance' }}>
            Ready to ship video calls?
          </h2>
          <p className="text-slate-300 text-base mb-10">
            Create an account, make a project, get your API key. First call in under ten minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold text-sm px-8 py-3.5 rounded-lg transition-all hover:bg-slate-100">
              Create free account →
            </Link>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-white font-medium text-sm px-8 py-3.5 rounded-lg border border-white/20 hover:border-white/40 transition-all">
              View dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer style={{ background: '#040810', borderTop: '1px solid #1A2642' }} className="px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <div>
            <span className="font-mono font-bold text-white text-sm">BlueJoinet</span>
            <p className="text-xs text-slate-600 mt-1">Video Communication Infrastructure — built for startups</p>
          </div>
          <div className="flex items-center gap-8">
            <a href="#pricing" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Pricing</a>
            <a href="#debugging" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Debugging</a>
            <Link href="/docs" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Docs</Link>
            <Link href="/dashboard" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Dashboard</Link>
            <Link href="/login" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Login</Link>
            <Link href="/signup" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
