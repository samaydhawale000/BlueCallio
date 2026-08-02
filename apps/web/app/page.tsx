import Link from "next/link";
import Image from "next/image";
import logo from "./assets/images/logo.png";

const USE_CASES = [
   {
      icon: "🎯",
      label: "HR & Recruitment",
      description:
         "Interview candidates inside your hiring platform. No third-party meeting links, no context switching.",
   },
   {
      icon: "🏥",
      label: "Telemedicine",
      description:
         "Doctor-patient consultations embedded in your healthcare product. Secure, compliant, and seamless.",
   },
   {
      icon: "💼",
      label: "CRM & Sales",
      description:
         "Call leads without leaving the CRM. Call records attach to the contact automatically.",
   },
   {
      icon: "🎧",
      label: "Customer Support",
      description:
         "Agents connect to customers instantly — no hold music, no plugin downloads required.",
   },
   {
      icon: "📚",
      label: "EdTech",
      description:
         "Live tutoring and classes built into your learning platform. Students never leave your product.",
   },
   {
      icon: "🛒",
      label: "Marketplace",
      description:
         "Buyers and sellers meet face-to-face inside your platform before any transaction.",
   },
];

const FEATURES = [
   {
      title: "Audio & Video Calls",
      body: "1-to-1 audio and video over peer-to-peer WebRTC. Low latency, no monthly media bill.",
   },
   {
      title: "Screen Sharing",
      body: "Share a desktop or application window mid-call — no extra integration required.",
   },
   {
      title: "Hosted Call UI",
      body: "A ready-made branded call page at a URL you control. No frontend SDK, no React dependency.",
   },
   {
      title: "REST API",
      body: "Create, accept, reject, end, join, and leave calls with plain HTTP. Any language, any framework.",
   },
   {
      title: "WebSocket Signaling",
      body: "Standardized real-time events — call.started, participant.joined, media state — handled server-side.",
   },
   {
      title: "React Components",
      body: "Reusable MeetingProvider, ParticipantGrid, ControlBar components. Custom UI, zero WebRTC code.",
   },
   {
      title: "Headless SDK",
      body: "meeting.join(), camera.enable(), screenShare.start() — complete control with the @bluejoinet/sdk engine.",
   },
   {
      title: "Waiting Room",
      body: "Built-in waiting room for scheduled meetings. Guests wait until the host lets them in.",
   },
   {
      title: "Device Selection",
      body: "Let users pick their camera, microphone, and speaker before and during a call.",
   },
   {
      title: "Hosted UI Branding",
      body: "Your logo, your company name, your colors. The hosted page matches your product on every call.",
   },
   {
      title: "Webhook Events",
      body: "Receive signed HTTP POSTs when call state changes. HMAC-SHA256 verified.",
   },
   {
      title: "Per-project API Keys",
      body: "Isolate credentials per product or environment. Rotate without downtime.",
   },
   {
      title: "TURN Relay",
      body: "Built-in TURN server for calls behind strict firewalls. Time-limited HMAC credentials.",
   },
   {
      title: "Developer Dashboard",
      body: "Manage projects, API keys, calls history, and usage minutes from one dashboard.",
   },
   {
      title: "Node.js SDK",
      body: "npm package that wraps the REST API and the communication engine. Type-safe, zero config.",
   },
];

const PRODUCTS = [
   {
      icon: "🖥",
      tag: "5-minute integration",
      name: "Hosted UI",
      tagline: "The fastest way to integrate BlueJoinet.",
      body: "Create a call from your backend and redirect users to a BlueJoinet-hosted meeting page. No frontend implementation required.",
      features: [
         "Ready-made meeting interface",
         "Video, audio & screen sharing",
         "Device selection",
         "Waiting room",
         "Branding support",
         "Fully responsive",
      ],
      code: "POST /calls → hostedUrl + participant tokens",
      cta: "Create a call, redirect your users, done.",
   },
   {
      icon: "⚛️",
      tag: "Custom UI, zero WebRTC",
      name: "React Components",
      tagline: "A custom interface without building a meeting app.",
      body: "Reusable React components for developers who want a branded experience without touching WebRTC, signaling, or media handling.",
      features: [
         "MeetingProvider & MeetingRoom",
         "ParticipantGrid / ParticipantTile",
         "Control bar buttons",
         "DeviceSelector panel",
         "WaitingRoom panel",
         "Connection & speaking indicators",
      ],
      code: "<MeetingProvider token={token}><ParticipantGrid /><ControlBar /></MeetingProvider>",
      cta: "Build a fully branded meeting experience.",
   },
   {
      icon: "🧩",
      tag: "Full control",
      name: "Headless SDK",
      tagline: "Complete control over the meeting experience.",
      body: "Just the communication engine — no UI included. You build the interface, BlueJoinet handles signaling, auth, and media infrastructure.",
      features: [
         "join() / leave()",
         "camera & microphone controls",
         "screenShare.start() / stop()",
         "participants() & connectionState()",
         "Full event system",
         "Type-safe TypeScript",
      ],
      code: "const meeting = new BlueJoinet({ token }); await meeting.join();",
      cta: "Build your own UI on a proven engine.",
   },
];

const STEPS = [
   {
      step: "Create a call",
      body: "Your backend sends POST /calls with a caller ID and receiver ID. BlueJoinet returns a secure token for each participant.",
   },
   {
      step: "Redirect your users",
      body: "Send each participant to the BlueJoinet hosted URL with their token. That's the only frontend work you do.",
   },
   {
      step: "BlueJoinet takes over",
      body: "Signaling, WebRTC negotiation, media controls, screen sharing, and the call UI — all handled.",
   },
];

const PLANS = [
   {
      name: "Starter",
      price: "Free",
      sub: "No credit card required",
      desc: "Perfect for building and testing.",
      features: [
         "500 minutes included",
         "Unlimited projects",
         "Unlimited developers",
         "REST API + WebSocket",
         "Hosted UI — with branding",
         "React UI components",
         "Headless SDK",
         "Playground",
         "TURN relay",
         "Community support",
      ],
      cta: "Get started free",
      ctaHref: "/signup",
      featured: false,
      showPrice: true,
   },
   {
      name: "Launch",
      price: "₹999",
      sub: "per month",
      desc: "Perfect for early startups.",
      features: [
         "2,500 minutes",
         "Everything in Starter",
         "Voice & Video",
         "Webhooks",
         "Waiting room",
         "Device selection",
         "Usage analytics",
         "Email support",
      ],
      cta: "Start Launch",
      ctaHref: "/signup",
      featured: false,
      showPrice: true,
   },
   {
      name: "Growth",
      price: "₹2,499",
      sub: "per month",
      desc: "For growing SaaS products.",
      features: [
         "10,000 minutes",
         "Everything in Launch",
         "Priority support",
         "Higher API limits",
         "Advanced analytics",
         "Call history & details",
         "Team management",
      ],
      cta: "Start Growth",
      ctaHref: "/signup",
      featured: true,
      showPrice: true,
   },
   {
      name: "Costom Plans",
      price: "NA",
      sub: "starting price",
      desc: "For high-volume production apps.",
      features: [
         "Unlimited minutes",
         "Dedicated TURN server",
         "SLA guarantee",
         "Technical account manager",
         "Custom branding & domains",
         "Custom integrations",
         "Dedicated infrastructure",
         "Volume discounts",
      ],
      cta: "Talk to Sales",
      ctaHref: "mailto:hello@bluejoinet.com",
      featured: false,
      showPrice: false,
   },
];

const PLAYGROUND_STEPS = [
   { step: "1", label: 'Click "Create Call"', done: true },
   { step: "2", label: "Two URLs appear — caller + receiver", done: true },
   { step: "3", label: "Open each in a browser tab", done: true },
   { step: "4", label: "Video call starts immediately", done: false },
];

const SUPPORT_ITEMS = [
   {
      icon: "⚡",
      title: "Fast Response",
      body: "Technical engineers, not marketing bots.",
   },
   {
      icon: "📖",
      title: "Clear Docs",
      body: "Quick start, copy buttons, examples in multiple languages.",
   },
   {
      icon: "🛠",
      title: "Working Examples",
      body: "Node.js, Python, cURL — drop in and it works.",
   },
   {
      icon: "🌍",
      title: "Community",
      body: "Ask questions, share integrations, get help.",
   },
];

export default function LandingPage() {
   return (
      <div className="lp-root">

         {/* ── Hero ── */}
         <section className="section-base relative pt-24 pb-32 px-6 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
               <div className="hero-mesh-wrapper">
                  <div className="hero-blob hero-blob-1" />
                  <div className="hero-blob hero-blob-2" />
                  <div className="hero-blob hero-blob-3" />
               </div>
               <div className="hero-grain" />
            </div>

            <div className="relative max-w-6xl mx-auto">
               <div className="hero-badge inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-8 border">
                  <span className="hero-badge-dot w-1.5 h-1.5 rounded-full animate-pulse" />
                  No per-minute pricing &nbsp;·&nbsp; No complex setup
                  &nbsp;·&nbsp; Startup-first
               </div>

               <h1 className="lp-h1 font-bold text-white leading-tight mb-6">
                  Build real-time communication into your product
                  <br />
                  <span className="gradient-text-hero">
                     in minutes, not weeks.
                  </span>
               </h1>

               <p className="text-balance text-slate-400 text-lg leading-relaxed mb-10 max-w-2xl">
                  Integrate secure voice and video calling with just two API
                  calls. No WebRTC expertise, no frontend SDK, no complex
                  infrastructure, and no unpredictable per-minute billing.
                  BlueJoinet gives startups everything they need to launch
                  communication features faster.
               </p>

               <div className="flex flex-wrap gap-4 mb-16">
                  <Link
                     href="/dashboard"
                     className="btn-primary inline-flex items-center gap-2 text-white font-medium text-sm px-6 py-3 rounded-lg transition-all hover:opacity-90"
                  >
                     Start building free<span>→</span>
                  </Link>
                  <Link
                     href="/docs"
                     className="btn-secondary inline-flex items-center gap-2 font-medium text-sm px-6 py-3 rounded-lg border border-[#1A2642] transition-all hover:border-slate-500 hover:text-white text-slate-300"
                  >
                     Read the docs
                  </Link>
               </div>

               {/* Code snippet */}
               <div className="lp-code-block max-w-2xl rounded-xl overflow-hidden border border-[#1A2642]">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A2642]">
                     <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                     <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                     <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                     <span className="font-mono text-slate-500 text-xs ml-2">
                        your-server.js
                     </span>
                     <span className="ml-auto text-xs text-slate-600 font-mono">
                        integration takes minutes, not days
                     </span>
                  </div>
                  <pre className="lp-pre font-mono text-sm px-5 py-5 overflow-x-auto">
                     <span className="tok-comment">{`// 1. Create a call from your backend\n`}</span>
                     <span className="tok-keyword">{"const "}</span>
                     <span className="tok-base">
                        {"{ callId, hostedUrl, participants } = "}
                     </span>
                     <span className="tok-async">{"await "}</span>
                     <span className="tok-base">{"BlueJoinet."}</span>
                     <span className="tok-fn">{"createCall"}</span>
                     <span className="tok-base">
                        {"({ callerId, receiverId })\n\n"}
                     </span>
                     <span className="tok-comment">{`// 2. Redirect each user — you're done\n`}</span>
                     <span className="tok-async">{"redirect"}</span>
                     <span className="tok-base">{`(alice, participants[0].hostedUrl)\n`}</span>
                     <span className="tok-async">{"redirect"}</span>
                     <span className="tok-base">{`(bob, participants[1].hostedUrl)`}</span>
                  </pre>
               </div>
            </div>
         </section>

         {/* ── Problem / Solution ── */}
         <section className="section-alt py-24 px-6">
            <div className="max-w-6xl mx-auto">
               <p className="section-label font-mono text-xs tracking-widest uppercase mb-4">
                  Why BlueJoinet
               </p>
               <h2 className="lp-h2 font-bold text-white mb-4">
                  Enterprise-grade communication. Startup-friendly pricing.
               </h2>
               <p className="text-slate-400 mb-14 max-w-2xl">
                  Enterprise communication tools are powerful but expensive,
                  complex, and loaded with features you never use.
               </p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card-problem rounded-xl border border-red-900/30 p-8">
                     <p className="font-mono text-xs tracking-widest uppercase mb-6 text-red-400">
                        The problem today
                     </p>
                     <div className="space-y-3">
                        {[
                           "Expensive per-minute pricing",
                           "Confusing pricing with hidden fees",
                           "Complex SDKs that take weeks to integrate",
                           "Enterprise-only documentation",
                           "Overloaded dashboards not built for developers",
                        ].map((item) => (
                           <div key={item} className="flex items-start gap-3">
                              <span className="text-red-500 mt-0.5 text-sm">
                                 ✕
                              </span>
                              <p className="text-sm text-slate-400">{item}</p>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="card-gradient rounded-xl border border-[#2A3D64] p-8">
                     <p className="section-label font-mono text-xs tracking-widest uppercase mb-6">
                        The BlueJoinet way
                     </p>
                     <div className="space-y-3">
                        {[
                           "Predictable flat pricing — you always know what you pay",
                           "No hidden fees, no confusing calculators",
                           "Integration in minutes with a simple REST API",
                           "Documentation treated as a product",
                           "Developer-first dashboard with the tools you need",
                        ].map((item) => (
                           <div key={item} className="flex items-start gap-3">
                              <span className="text-green-400 mt-0.5 text-sm">
                                 ✓
                              </span>
                              <p className="text-sm text-slate-300">{item}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* ── Use cases ── */}
         <section className="section-base py-24 px-6">
            <div className="max-w-6xl mx-auto">
               <p className="section-label font-mono text-xs tracking-widest uppercase mb-4">
                  Who it&apos;s for
               </p>
               <h2 className="lp-h2 font-bold text-white mb-4">
                  Any product that needs real-time video between two people
               </h2>
               <p className="text-slate-400 mb-14 max-w-2xl">
                  BlueJoinet is B2B infrastructure. Your customers never know it
                  exists — it just works, invisibly, inside your product.
               </p>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {USE_CASES.map((uc) => (
                     <div
                        key={uc.label}
                        className="card-gradient rounded-xl border border-[#1A2642] p-6 transition-all hover:border-[#2A3D64]"
                     >
                        <div className="text-2xl mb-4">{uc.icon}</div>
                        <p className="font-semibold text-white mb-2 text-sm">
                           {uc.label}
                        </p>
                        <p className="text-sm text-slate-400 leading-relaxed">
                           {uc.description}
                        </p>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* ── Products ── */}
         <section id="products" className="section-base py-24 px-6">
            <div className="max-w-6xl mx-auto">
               <p className="section-label font-mono text-xs tracking-widest uppercase mb-4">
                  Products
               </p>
               <h2 className="lp-h2 font-bold text-white mb-4">
                   Three ways to integrate.
               </h2>
               <p className="text-slate-400 mb-14 max-w-2xl">
                  Choose the integration style that fits your product. All three
                  are powered by the same REST + WebSocket backend — so you can
                  move between them without changing your server-side code.
               </p>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {PRODUCTS.map((product) => (
                     <div
                        key={product.name}
                        className="card-surface rounded-xl border border-[#1A2642] p-7 flex flex-col transition-all hover:border-[#2A3D64]"
                     >
                        <div className="flex items-center justify-between mb-5">
                           <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.25)' }}
                           >
                              {product.icon}
                           </div>
                           <span
                              className="text-[10px] font-mono px-2.5 py-1 rounded-full uppercase tracking-widest"
                              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#A5B4FC' }}
                           >
                              {product.tag}
                           </span>
                        </div>

                        <h3 className="font-bold text-white text-lg mb-1">
                           {product.name}
                        </h3>
                        <p className="text-sm font-medium text-slate-300 mb-3">
                           {product.tagline}
                        </p>
                        <p className="text-sm text-slate-400 leading-relaxed mb-6">
                           {product.body}
                        </p>

                        <div className="space-y-2 mb-6">
                           {product.features.map((f) => (
                              <div key={f} className="flex items-start gap-2">
                                 <span className="check-indigo text-xs mt-0.5">✓</span>
                                 <p className="text-sm text-slate-400">{f}</p>
                              </div>
                           ))}
                        </div>

                        <div
                           className="rounded-lg px-3 py-2.5 mb-6 font-mono text-[11px] text-slate-500"
                           style={{ background: '#060B18', border: '1px solid #1A2642', overflowX: 'auto', whiteSpace: 'nowrap' }}
                        >
                           {product.code}
                        </div>

                        <p className="text-xs text-slate-500 mb-5 flex-1">
                           {product.cta}
                        </p>

                        <Link
                           href="/docs"
                           className="block text-center text-sm font-medium text-white px-4 py-2.5 rounded-lg transition-all hover:opacity-90"
                           style={{
                              background: product.name === 'React Components'
                                 ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                                 : 'rgba(255,255,255,0.04)',
                              border: product.name === 'React Components' ? 'none' : '1px solid #1A2642',
                           }}
                        >
                           Learn more in docs →
                        </Link>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* ── Features ── */}
         <section id="features" className="section-base py-24 px-6">
            <div className="max-w-6xl mx-auto">
               <p className="section-label font-mono text-xs tracking-widest uppercase mb-4">
                  What you get
               </p>
               <h2 className="lp-h2 font-bold text-white mb-14">
                  Everything in the box
               </h2>
               <div className="features-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px">
                  {FEATURES.map((f) => (
                     <div key={f.title} className="feature-cell p-6">
                        <div className="feature-bar w-1 h-4 rounded-full mb-4" />
                        <p className="font-semibold text-white text-sm mb-2">
                           {f.title}
                        </p>
                        <p className="text-sm text-slate-400 leading-relaxed">
                           {f.body}
                        </p>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* ── Playground ── */}
         <section className="section-alt py-24 px-6">
            <div className="max-w-6xl mx-auto">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div>
                     <p className="section-label font-mono text-xs tracking-widest uppercase mb-4">
                        Live Playground
                     </p>
                     <h2 className="lp-h2 font-bold text-white mb-4">
                        Test before you integrate
                     </h2>
                     <p className="text-slate-400 mb-8 leading-relaxed">
                        Create a call, open two browser tabs, start the call —
                        see everything working before you write a single line of
                        integration code.
                     </p>
                     <Link
                        href="/dashboard/playground"
                        className="btn-primary inline-flex items-center gap-2 text-white font-medium text-sm px-6 py-3 rounded-lg transition-all hover:opacity-90"
                     >
                        Open playground →
                     </Link>
                  </div>

                  <div className="card-surface rounded-xl border border-[#1A2642] overflow-hidden">
                     <div className="px-5 py-4 border-b border-[#1A2642] flex items-center gap-2">
                        <span className="hero-badge-dot w-2 h-2 rounded-full" />
                        <span className="text-xs text-slate-400 font-mono">
                           BlueJoinet Playground
                        </span>
                     </div>
                     <div className="p-6">
                        <div className="flex flex-col gap-3">
                           {PLAYGROUND_STEPS.map((item) => (
                              <div
                                 key={item.step}
                                 className="flex items-center gap-3"
                              >
                                 <div
                                    className={`${item.done ? "step-done" : "step-pending"} w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0`}
                                 >
                                    {item.done ? "✓" : item.step}
                                 </div>
                                 <p
                                    className={`text-sm ${item.done ? "text-white" : "text-slate-500"}`}
                                 >
                                    {item.label}
                                 </p>
                              </div>
                           ))}
                        </div>
                        <div className="feature-cell mt-6 rounded-lg p-3 border border-[#1A2642] text-center text-xs text-slate-500 font-mono">
                           No API key required. No code required.
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* ── Pricing ── */}
         <section id="pricing" className="section-base py-24 px-6">
            <div className="max-w-6xl mx-auto">
               <p className="section-label font-mono text-xs tracking-widest uppercase mb-4">
                  Pricing
               </p>
               <h2 className="lp-h2 font-bold text-white mb-4">
                  Transparent pricing. No surprises.
               </h2>
               <p className="text-slate-400 mb-14 max-w-2xl">
                  No confusing calculators, no hidden fees. You understand our
                  pricing in one minute.
               </p>

               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                  {PLANS.map((plan) => (
                     <div
                        key={plan.name}
                        className={`${plan.featured ? "card-featured border-[#2A3D64]" : "card-surface border-[#1A2642]"} relative rounded-xl border p-7 flex flex-col`}
                     >
                        {plan.featured && (
                           <div className="badge-gradient absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-mono px-3 py-0.5 rounded-full text-white whitespace-nowrap">
                              Most popular
                           </div>
                        )}

                        <p className="font-semibold text-white mb-1">
                           {plan.name}
                        </p>
                        <p className="text-slate-500 text-xs mb-5">
                           {plan.desc}
                        </p>
                        {plan.showPrice && (
                           <div className="mb-5">
                              <span className="price-text font-bold text-white">
                                 {plan.price}
                              </span>
                              {plan.price !== "Free" && (
                                 <span className="text-slate-500 text-xs ml-1">
                                    {plan.sub}
                                 </span>
                              )}
                              {plan.price === "Free" && (
                                 <p className="text-xs text-slate-500 mt-0.5">
                                    {plan.sub}
                                 </p>
                              )}
                           </div>
                        )}

                        <div className="space-y-2.5 mb-8 flex-1">
                           {plan.features.map((f) => (
                              <div key={f} className="flex items-start gap-2">
                                 <span
                                    className={`${plan.featured ? "check-violet" : "check-indigo"} text-xs mt-0.5`}
                                 >
                                    ✓
                                 </span>
                                 <p
                                    className={`text-sm ${plan.featured ? "text-slate-300" : "text-slate-400"}`}
                                 >
                                    {f}
                                 </p>
                              </div>
                           ))}
                        </div>

                        {plan.ctaHref.startsWith("mailto") ? (
                           <a
                              href={plan.ctaHref}
                              className="block text-center text-sm font-medium text-white px-4 py-2.5 rounded-lg border border-[#1A2642] hover:border-[#2A3D64] transition-all"
                           >
                              {plan.cta}
                           </a>
                        ) : (
                           <Link
                              href={plan.ctaHref}
                              className={`${plan.featured ? "btn-primary" : "border border-[#1A2642] hover:border-[#2A3D64]"} block text-center text-sm font-medium text-white px-4 py-2.5 rounded-lg transition-all hover:opacity-90`}
                           >
                              {plan.cta}
                           </Link>
                        )}
                     </div>
                  ))}
               </div>

               <p className="text-center text-xs text-slate-600 mt-8">
                  All prices in INR. No hidden charges. No per-minute billing.
               </p>
            </div>
         </section>

         {/* ── Support ── */}
         <section className="section-alt py-24 px-6">
            <div className="max-w-6xl mx-auto">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div>
                     <p className="section-label font-mono text-xs tracking-widest uppercase mb-4">
                        Support
                     </p>
                     <h2 className="lp-h2 font-bold text-white mb-4">
                        Real answers from technical people
                     </h2>
                     <p className="text-slate-400 leading-relaxed">
                        When something breaks, you need a fast answer from
                        someone who actually knows the stack — not a chatbot
                        pointing to a FAQ. BlueJoinet support is run by the
                        engineers who built it.
                     </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     {SUPPORT_ITEMS.map((item) => (
                        <div
                           key={item.title}
                           className="card-surface rounded-xl border border-[#1A2642] p-5"
                        >
                           <div className="text-xl mb-3">{item.icon}</div>
                           <p className="font-semibold text-white text-sm mb-1">
                              {item.title}
                           </p>
                           <p className="text-xs text-slate-500 leading-relaxed">
                              {item.body}
                           </p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </section>

         {/* ── CTA ── */}
         <section className="py-28 px-6 relative overflow-hidden">
            <div className="cta-bg absolute inset-0" />
            <div className="cta-grid absolute inset-0 pointer-events-none" />
            <div className="relative max-w-2xl mx-auto text-center">
               <h2 className="lp-h2-cta font-bold text-white mb-4">
                  Ready to ship video calls?
               </h2>
               <p className="text-slate-300 text-base mb-10">
                  Create an account, make a project, get your API key. First
                  call in under ten minutes.
               </p>
               <div className="flex flex-wrap justify-center gap-4">
                  <Link
                     href="/signup"
                     className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold text-sm px-8 py-3.5 rounded-lg transition-all hover:bg-slate-100"
                  >
                     Create free account →
                  </Link>
                  <Link
                     href="/docs"
                     className="inline-flex items-center gap-2 text-white font-medium text-sm px-8 py-3.5 rounded-lg border border-white/20 hover:border-white/40 transition-all"
                  >
                     Read the docs
                  </Link>
               </div>
            </div>
         </section>
      </div>
   );
}
