'use client';

import Link from 'next/link';
import { useState } from 'react';

const FAQ_GROUPS = [
  {
    group: 'Products & Integration',
    items: [
      {
        q: 'Which integration should I pick?',
        a: 'Hosted UI is the fastest path (5 minutes — just create a call and redirect your users). React Components let you build a branded custom interface without implementing WebRTC. Headless SDK gives you complete control over the UI while BlueJoinet handles signaling, authentication, and media infrastructure.',
      },
      {
        q: 'Can I switch between the three products later?',
        a: 'Yes. All three products are powered by the same backend, the same POST /calls response, and the same per-participant session tokens. You can change your frontend integration without changing your server-side code.',
      },
      {
        q: 'What is the difference between @bluejoinet/sdk and @bluejoinet/react?',
        a: '@bluejoinet/sdk is the headless communication engine (join, leave, camera, microphone, screen share, events). @bluejoinet/react is a component library built on top of the core SDK — it provides ready-made React components (MeetingProvider, ParticipantGrid, ControlBar, etc.) that call into the engine for you.',
      },
      {
        q: 'Do you support group calls?',
        a: 'Currently BlueJoinet supports 1:1 audio and video calls. Group calls are on the roadmap.',
      },
    ],
  },
  {
    group: 'Authentication & Security',
    items: [
      {
        q: 'Where do I put the API key?',
        a: 'Server-side only. Your API key (starts with bj_live_) is used by your backend to create calls. Never send it to the browser. The hosted page uses per-participant session tokens (starts with bj_session_) which are cryptographically tied to one participant and one call.',
      },
      {
        q: 'What authentication methods are supported?',
        a: 'BlueJoinet supports two server-side authentication methods: API Keys (x-api-key header, ideal for backend integration) and JWT (for the dashboard and playground). Call participants authenticate with short-lived session tokens over WebSocket.',
      },
      {
        q: 'Are session tokens single-use?',
        a: 'Yes. Each session token is tied to one participant and one call, and expires after 24 hours. If someone needs a new invite, create a new call.',
      },
      {
        q: 'Are webhooks signed?',
        a: 'Yes. Every webhook POST includes an X-BlueJoinet-Signature header (HMAC-SHA256 with your project secret). Always verify it before processing the payload.',
      },
    ],
  },
  {
    group: 'Media & Network',
    items: [
      {
        q: 'What about calls behind strict firewalls?',
        a: 'BlueJoinet provides TURN relay with time-limited HMAC credentials. The hosted UI and SDK fetch ICE servers automatically — no configuration needed on your side.',
      },
      {
        q: 'What browsers are supported?',
        a: 'BlueJoinet uses standard WebRTC, so any modern browser works — Chrome, Firefox, Safari, Edge. Mobile browsers are fully supported with responsive layouts.',
      },
      {
        q: 'Can my users select which camera and microphone to use?',
        a: 'Yes. The hosted UI includes a DeviceSelector, and the React SDK exposes useDevices() plus a DeviceSelector component. Developers on the Headless SDK can manage devices programmatically.',
      },
      {
        q: 'Is screen sharing supported?',
        a: 'Yes — screen sharing works in all three products. The hosted UI has a built-in Share Screen control, React has a ScreenShareButton, and the SDK exposes screenShare.start() / screenShare.stop().',
      },
    ],
  },
  {
    group: 'Pricing & Billing',
    items: [
      {
        q: 'How does pricing work?',
        a: 'We offer predictable flat tiers — no per-minute surprises. The Starter plan is free with 500 minutes. Paid plans add more minutes, webhooks, analytics, and priority support. See the pricing section on the homepage.',
      },
      {
        q: 'Is there a free plan?',
        a: 'Yes. The Starter plan is free forever and includes 500 minutes, unlimited projects, the REST API + WebSocket signaling, hosted UI, playground, and TURN relay.',
      },
      {
        q: 'Can I cancel at any time?',
        a: 'Yes. All plans are month-to-month with no lock-in. Manage your subscription from the dashboard.',
      },
    ],
  },
  {
    group: 'Development & Support',
    items: [
      {
        q: 'How do I debug a failed call?',
        a: 'Check the WebSocket connection state, verify the session token matches the correct participant, ensure camera/microphone permissions are granted, and confirm TURN credentials are returned from /turn/credentials. The docs FAQ covers common failure modes.',
      },
      {
        q: 'Where can I test before integrating?',
        a: 'Try the Live Playground — create a call, open two browser tabs, and start a video call with no code and no API key required.',
      },
      {
        q: 'Who do I talk to for support?',
        a: 'BlueJoinet support is run by the engineers who built the platform. Email hello@bluejoinet.com and you will get a technical answer.',
      },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl border border-[#1A2642] overflow-hidden transition-all"
      style={{ background: open ? '#0A1525' : '#0D1421' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-all"
      >
        <span className="text-sm font-semibold text-white">{q}</span>
        <span
          className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs text-slate-400 transition-all"
          style={{ background: open ? 'rgba(99,102,241,0.15)' : '#1A2642', color: open ? '#A5B4FC' : '#64748B' }}
        >
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-[#1A2642]">
          <p className="text-sm text-slate-400 leading-relaxed pt-4">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div style={{ background: '#060B18', color: '#F1F5F9', minHeight: '100vh' }}>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-28 pb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-4 border" style={{ background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)', color: '#A5B4FC' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Frequently asked questions
        </div>
        <h1 className="font-bold text-white mb-3" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.03em' }}>
          Everything you need to know
        </h1>
        <p className="text-slate-400 text-base leading-relaxed max-w-2xl">
          Can't find what you're looking for? Email{' '}
          <a href="mailto:hello@bluejoinet.com" className="text-indigo-400 hover:underline">hello@bluejoinet.com</a>{' '}
          and an engineer will get back to you.
        </p>
      </div>

      {/* FAQ groups */}
      <div className="max-w-4xl mx-auto px-6 pb-24">
        <div className="flex flex-col gap-12">
          {FAQ_GROUPS.map((g) => (
            <div key={g.group}>
              <h2 className="font-semibold text-white mb-4" style={{ fontSize: '1.1rem' }}>
                <span className="gradient-text font-mono text-xs tracking-widest uppercase mr-3">{g.group}</span>
              </h2>
              <div className="flex flex-col gap-3">
                {g.items.map((item) => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-xl p-8 text-center border border-[#2A3D64]" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))' }}>
          <p className="font-bold text-white mb-2 text-lg">Still have questions?</p>
          <p className="text-slate-400 text-sm mb-6">Try the playground or read the docs — or talk to the engineers who built it.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/dashboard/playground" className="inline-flex items-center gap-2 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
              Open playground →
            </Link>
            <Link href="/signup" className="inline-flex items-center gap-2 text-slate-300 font-medium text-sm px-6 py-2.5 rounded-lg border border-[#1A2642] hover:border-[#2A3D64] transition-all">
              Get API key
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

