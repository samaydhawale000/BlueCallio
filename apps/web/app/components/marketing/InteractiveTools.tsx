"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "../../lib/api";
import { useEffect } from "react";
import { formatPaise, type BillingRates } from "../../lib/pricing";

const paths = [
   {
      id: "hosted",
      label: "Hosted UI",
      audience: "Ship a call experience with minimal frontend work.",
      builds: "Your backend creates the call and decides who can join.",
      handles:
         "Meeting UI, media controls, signaling, WebRTC setup, and TURN relay.",
      install: "No frontend package required.",
      code: `import { BlueCallioClient } from "@bluecallio/sdk";\n\nconst client = new BlueCallioClient({ apiKey: process.env.BLUECALLIO_API_KEY! });\nconst call = await client.createCall({ callerId, receiverId });\nredirect(call.callerUrl);`,
      href: "/docs/hosted-ui",
   },
   {
      id: "react",
      label: "React",
      audience: "Compose a branded meeting interface in a React application.",
      builds: "Your product layout, business logic, and branded experience.",
      handles:
         "Participant state, media streams, controls, signaling, and connection lifecycle.",
      install: "npm install @bluecallio/react",
      code: `import { MeetingProvider, ParticipantGrid } from "@bluecallio/react";\n\n<MeetingProvider token={token} callId={callId} signalUrl={signalUrl}>\n  <ParticipantGrid />\n</MeetingProvider>`,
      href: "/docs/react",
   },
   {
      id: "headless",
      label: "Headless SDK",
      audience: "Own every interaction and visual detail of the meeting.",
      builds: "The full interface and product-specific call interactions.",
      handles:
         "The communication engine, WebRTC media lifecycle, signaling, and TURN relay.",
      install: "npm install @bluecallio/sdk",
      code: `import { BlueCallioMeeting } from "@bluecallio/sdk";\n\nconst meeting = new BlueCallioMeeting({ token, callId, signalUrl });\nawait meeting.join();`,
      href: "/docs/javascript",
   },
   {
      id: "rest",
      label: "REST API",
      audience: "Use BlueCallio from any trusted backend environment.",
      builds: "Your authorization rules and application-specific call flow.",
      handles: "Call creation and the participant session information returned by the API.",
      install: "No SDK required.",
      code: `const response = await fetch("https://api.bluecallio.com/calls", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "x-api-key": process.env.BLUECALLIO_API_KEY!,\n  },\n  body: JSON.stringify({ callerId, receiverId, type: "VIDEO" }),\n});`,
      href: "/docs/rest-api",
   },
] as const;

export function CopyButton({ value }: { value: string }) {
   const [copied, setCopied] = useState(false);
   return (
      <button
         type="button"
         onClick={async () => {
            try {
               await navigator.clipboard?.writeText(value);
               setCopied(true);
               window.setTimeout(() => setCopied(false), 1600);
            } catch {
               /* Copy is an enhancement; the code remains selectable. */
            }
         }}
         className="rounded border border-[#2A3D64] px-2.5 py-1 text-xs text-slate-300 hover:border-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-300"
         aria-label="Copy code"
      >
         {copied ? "Copied" : "Copy"}
      </button>
   );
}

export function CodeBlock({
   code,
   filename = "example.ts",
}: {
   code: string;
   filename?: string;
}) {
   return (
      <div className="overflow-hidden rounded-xl border border-[#1A2642] bg-[#07111F]">
         <div className="flex items-center justify-between border-b border-[#1A2642] px-4 py-3">
            <span className="font-mono text-xs text-slate-500">{filename}</span>
            <CopyButton value={code} />
         </div>
         <pre className="overflow-x-auto p-5 text-sm leading-6 text-slate-200">
            <code>{code}</code>
         </pre>
      </div>
   );
}

export function IntegrationSelector({
   compact = false,
}: {
   compact?: boolean;
}) {
   const [selected, setSelected] =
      useState<(typeof paths)[number]["id"]>("hosted");
   const item = paths.find((path) => path.id === selected)!;
   return (
      <section
         className={
            compact
               ? ""
               : "rounded-2xl border border-[#1A2642] bg-[#0A0F1E] p-5 md:p-8"
         }
      >
         <div
            role="tablist"
            aria-label="Integration paths"
            className="flex flex-wrap gap-2 border-b border-[#1A2642] pb-4"
         >
            {paths.map((path) => (
               <button
                  key={path.id}
                  type="button"
                  role="tab"
                  aria-selected={selected === path.id}
                  onClick={() => setSelected(path.id)}
                  className={`rounded-lg px-4 py-2 text-sm transition ${selected === path.id ? "bg-indigo-500/20 text-white" : "text-slate-400 hover:text-white"}`}
               >
                  {path.label}
               </button>
            ))}
         </div>
         <div className="grid gap-6 pt-6 lg:grid-cols-[1fr_1.15fr]">
            <div>
               <p className="font-mono text-xs uppercase tracking-widest text-indigo-300">
                  {item.label}
               </p>
               <h3 className="mt-2 text-xl font-bold text-white">
                  {item.audience}
               </h3>
               <dl className="mt-5 space-y-4 text-sm leading-6">
                  <div>
                     <dt className="font-semibold text-slate-200">Best for</dt>
                     <dd className="text-slate-400">{item.builds}</dd>
                  </div>
                  <div>
                     <dt className="font-semibold text-slate-200">
                        What you get
                     </dt>
                     <dd className="text-slate-400">{item.handles}</dd>
                  </div>
                  <div>
                     <dt className="font-semibold text-slate-200">Installation</dt>
                     <dd className="font-mono text-slate-400">{item.install}</dd>
                  </div>
               </dl>
               <Link
                  href={item.href}
                  className="mt-6 inline-block text-sm font-medium text-indigo-300 hover:text-white"
               >
                  Read {item.label} documentation →
               </Link>
            </div>
            <div className="overflow-hidden rounded-xl border border-[#1A2642] bg-[#07111F]">
               <div className="flex items-center justify-between border-b border-[#1A2642] px-4 py-3">
                  <span className="font-mono text-xs text-slate-500">
                     integration.ts
                  </span>
                  <CopyButton value={item.code} />
               </div>
               <pre className="overflow-x-auto p-5 text-sm leading-6 text-slate-200">
                  <code>{item.code}</code>
               </pre>
            </div>
         </div>
      </section>
   );
}

const flow = [
   [
      "Your backend",
      "Your application decides when to create a call and which users may participate.",
   ],
   [
      "POST /calls",
      "A trusted server request creates the call and participant access.",
   ],
   [
      "Participant sessions",
      "Each participant receives only their own session access and hosted URL.",
   ],
   [
      "Integration surface",
      "Connect participants through hosted UI, React components, or the headless SDK.",
   ],
   [
      "WebRTC media",
      "The browser connects audio, video, and optional screen sharing.",
   ],
] as const;

export function FlowDiagram() {
   const [active, setActive] = useState(0);
   return (
      <section className="rounded-2xl border border-[#1A2642] bg-[#0A0F1E] p-5 md:p-8">
         <div className="flex flex-wrap items-center gap-2">
            {flow.map(([label], index) => (
               <button
                  type="button"
                  key={label}
                  onClick={() => setActive(index)}
                  className={`rounded-lg border px-3 py-2 text-sm ${active === index ? "border-indigo-400 bg-indigo-500/15 text-white" : "border-[#1A2642] text-slate-400 hover:text-white"}`}
               >
                  {index + 1}. {label}
               </button>
            ))}
         </div>
         <div className="mt-6 rounded-xl border border-[#1A2642] bg-[#060B18] p-5">
            <p className="font-semibold text-white">{flow[active][0]}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
               {flow[active][1]}
            </p>
         </div>
      </section>
   );
}

const nodes = [
   ["REST API", "Create and manage calls from trusted backend code."],
   ["Signaling", "WebSocket events coordinate real-time call state."],
   [
      "TURN relay",
      "A relay path supports networks where peers cannot connect directly.",
   ],
   [
      "WebRTC",
      "Browser media transport powers audio, video, and screen sharing.",
   ],
] as const;
export function ArchitectureExplorer() {
   const [active, setActive] = useState(0);
   return (
      <section className="rounded-2xl border border-[#1A2642] bg-[#0A0F1E] p-5 md:p-8">
         <div className="text-center text-sm text-slate-400">
            Your application
         </div>
         <div className="mx-auto h-6 w-px bg-indigo-400/50" />
         <div className="mx-auto max-w-xs rounded-xl border border-indigo-400/40 bg-indigo-500/10 p-3 text-center font-semibold text-white">
            BlueCallio
         </div>
         <div className="mx-auto h-6 w-px bg-indigo-400/50" />
         <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {nodes.map(([label], index) => (
               <button
                  type="button"
                  key={label}
                  onClick={() => setActive(index)}
                  className={`rounded-xl border p-4 text-left transition ${active === index ? "border-indigo-400 bg-indigo-500/15 text-white" : "border-[#1A2642] text-slate-400 hover:text-white"}`}
               >
                  {label}
               </button>
            ))}
         </div>
         <p className="mt-5 rounded-lg bg-[#060B18] p-4 text-sm leading-6 text-slate-400">
            <strong className="text-slate-200">{nodes[active][0]}: </strong>
            {nodes[active][1]}
         </p>
      </section>
   );
}

export function PricingCalculator() {
   const [rates, setRates] = useState<BillingRates | null>(null);
   const [people, setPeople] = useState(2);
   const [minutes, setMinutes] = useState(10);
   const [audio, setAudio] = useState(true);
   const [video, setVideo] = useState(true);
   const [screen, setScreen] = useState(false);
   const [screenPeople, setScreenPeople] = useState(1);
   const [screenDuration, setScreenDuration] = useState(5);
   useEffect(() => {
      api.get("/billing/rates")
         .then((response) => setRates(response.data))
         .catch(() => {});
   }, []);
   const audioMinutes = audio ? people * minutes : 0;
   const videoMinutes = video ? people * minutes : 0;
   const screenMinutes = screen ? screenPeople * screenDuration : 0;
   const billableAudio = rates ? Math.max(0, audioMinutes - rates.freeAudioMins) : null;
   const billableVideo = rates ? Math.max(0, videoMinutes - rates.freeVideoMins) : null;
   const amountPaise = rates && billableAudio !== null && billableVideo !== null
      ? billableAudio * rates.audioPaise + billableVideo * rates.videoPaise + screenMinutes * rates.screenSharePaise
      : null;
   return (
      <section className="rounded-2xl border border-[#1A2642] bg-[#0A0F1E] p-5 md:p-8">
         <h2 className="text-2xl font-bold text-white">
            Estimate participant-minute usage
         </h2>
         <p className="mt-2 text-sm text-slate-400">
            A participant-minute is one connected participant for one minute.
            This uses current public rates when available and is an estimate,
            not an invoice.
         </p>
         <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="text-sm text-slate-300">
               Participants{" "}
               <input
                  aria-label="Participants"
                  type="number"
                  min="1"
                  max="100"
                  value={people}
                  onChange={(event) =>
                     setPeople(Math.max(1, Number(event.target.value)))
                  }
                  className="mt-2 w-full rounded-lg border border-[#2A3D64] bg-[#060B18] p-3 text-white"
               />
            </label>
            <label className="text-sm text-slate-300">
               Wall-clock call duration (minutes){" "}
               <input
                  aria-label="Call duration in minutes"
                  type="number"
                  min="1"
                  max="1440"
                  value={minutes}
                  onChange={(event) =>
                     setMinutes(Math.max(1, Number(event.target.value)))
                  }
                  className="mt-2 w-full rounded-lg border border-[#2A3D64] bg-[#060B18] p-3 text-white"
               />
            </label>
         </div>
         <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <label>
               <input
                  type="checkbox"
                  checked={audio}
                  onChange={(event) => setAudio(event.target.checked)}
               />{" "}
               Audio
            </label>
            <label>
               <input
                  type="checkbox"
                  checked={video}
                  onChange={(event) => setVideo(event.target.checked)}
               />{" "}
               Video
            </label>
            <label>
               <input
                  type="checkbox"
                  checked={screen}
                  onChange={(event) => setScreen(event.target.checked)}
               />{" "}
               Screen sharing
            </label>
         </div>
         {screen && (
            <div className="mt-5 grid max-w-xl gap-5 sm:grid-cols-2">
               <label className="text-sm text-slate-300">
                  Screen-sharing participants
                  <input aria-label="Screen-sharing participants" type="number" min="1" max={people} value={screenPeople} onChange={(event) => setScreenPeople(Math.min(people, Math.max(1, Number(event.target.value))))} className="mt-2 w-full rounded-lg border border-[#2A3D64] bg-[#060B18] p-3 text-white" />
               </label>
               <label className="text-sm text-slate-300">
                  Screen-share duration (minutes)
                  <input aria-label="Screen-share duration in minutes" type="number" min="1" max={minutes} value={screenDuration} onChange={(event) => setScreenDuration(Math.min(minutes, Math.max(1, Number(event.target.value))))} className="mt-2 w-full rounded-lg border border-[#2A3D64] bg-[#060B18] p-3 text-white" />
               </label>
            </div>
         )}
         <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
           <div className="rounded-lg bg-[#060B18] p-4">
               <p className="text-xs text-slate-500">Wall-clock duration</p>
               <p className="mt-1 text-xl font-bold text-white">{minutes} minutes</p>
           </div>
           <div className="rounded-lg bg-[#060B18] p-4">
               <p className="text-xs text-slate-500">Audio participant-minutes</p>
               <p className="mt-1 text-xl font-bold text-white">{audioMinutes}</p>
           </div>
           <div className="rounded-lg bg-[#060B18] p-4">
               <p className="text-xs text-slate-500">Video participant-minutes</p>
               <p className="mt-1 text-xl font-bold text-white">{videoMinutes}</p>
            </div>
            <div className="rounded-lg bg-[#060B18] p-4">
               <p className="text-xs text-slate-500">Screen-sharing minutes</p>
               <p className="mt-1 text-xl font-bold text-white">{screenMinutes}</p>
            </div>
            <div className="rounded-lg bg-[#060B18] p-4">
               <p className="text-xs text-slate-500">Billable participant-minutes</p>
               <p className="mt-1 text-xl font-bold text-white">{billableAudio === null || billableVideo === null ? "Loading…" : billableAudio + billableVideo + screenMinutes}</p>
            </div>
            <div className="rounded-lg bg-[#060B18] p-4">
               <p className="text-xs text-slate-500">Estimated usage cost (pre-tax)</p>
               <p className="mt-1 text-xl font-bold text-white">
                  {amountPaise === null ? "Loading rates…" : formatPaise(amountPaise)}
               </p>
            </div>
         </div>
      </section>
   );
}

const quickstartSteps = [
   ["Create a BlueCallio account", "Create an account and sign in to the dashboard.", "You can access the dashboard.", "Create a project."],
   ["Create a project", "Add a project for the application that will create calls.", "A project appears in your dashboard.", "Generate a project API key."],
   ["Generate an API key", "Create a project API key and store it in your server environment.", "You have a server-side secret.", "Install the SDK."],
   ["Install the SDK", "npm install @bluecallio/sdk", "The SDK is available to your backend.", "Create a call from your backend."],
   ["Create a call", "const call = await client.createCall({ callerId: \"user_alice\", receiverId: \"user_bob\" });", "The API returns a call ID and participant session information.", "Return session information to the frontend."],
   ["Return session information", "Return only the authenticated participant's token, callId, and signalUrl to the browser.", "The browser has participant-scoped connection information.", "Join the call."],
   ["Join the call", "const meeting = new BlueCallioMeeting({ token, callId, signalUrl });\nawait meeting.join();", "The participant joins the call.", "Test microphone and camera."],
   ["Test audio and video", "await meeting.microphone.enable();\nawait meeting.camera.enable();", "The browser asks for media permission.", "Test screen sharing."],
   ["Test screen sharing", "await meeting.screenShare.start();", "The browser presents its display-selection picker.", "Inspect usage."],
   ["Inspect usage", "Open Dashboard → Usage to review audio, video, and screen-sharing participant-minutes.", "Usage is shown by category.", "Review pricing and billing."],
] as const;

export function QuickstartStepper() {
   const [active, setActive] = useState(0);
   const [title, instruction, result, next] = quickstartSteps[active];
   return <section className="rounded-2xl border border-[#1A2642] bg-[#0A0F1E] p-5 md:p-8"><div className="flex flex-wrap gap-2">{quickstartSteps.map(([step], index) => <button key={step} type="button" onClick={() => setActive(index)} className={`rounded-lg px-3 py-2 text-sm ${active === index ? "bg-indigo-500/20 text-white" : "text-slate-400 hover:text-white"}`}>Step {index + 1}</button>)}</div><div className="mt-6"><p className="font-mono text-xs uppercase tracking-widest text-indigo-300">Step {active + 1} of {quickstartSteps.length}</p><h3 className="mt-2 text-xl font-bold text-white">{title}</h3><p className="mt-3 text-slate-400">{instruction}</p><CodeBlock code={instruction} filename="quickstart.ts" /><dl className="mt-5 grid gap-4 sm:grid-cols-2"><div><dt className="font-semibold text-slate-200">Expected result</dt><dd className="mt-1 text-sm text-slate-400">{result}</dd></div><div><dt className="font-semibold text-slate-200">Next action</dt><dd className="mt-1 text-sm text-slate-400">{next}</dd></div></dl></div></section>;
}

export function ReactMeetingPreview() {
   const [microphone, setMicrophone] = useState(true);
   const [camera, setCamera] = useState(true);
   const [sharing, setSharing] = useState(false);
   const [connected, setConnected] = useState(true);
   return <section className="rounded-2xl border border-[#1A2642] bg-[#0A0F1E] p-5 md:p-8"><div className="flex items-center justify-between"><h3 className="font-semibold text-white">Simulated React meeting UI</h3><span className={`rounded-full px-3 py-1 text-xs ${connected ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/15 text-slate-300"}`}>{connected ? "Connected" : "Left"}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="aspect-video rounded-xl bg-indigo-500/15 p-4 text-sm text-indigo-200">Local participant<br /><span className="text-slate-400">{camera ? "Camera on" : "Camera off"}</span></div><div className="aspect-video rounded-xl bg-[#07111F] p-4 text-sm text-slate-200">Remote participant<br /><span className="text-slate-500">Participant stream</span></div></div><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => setMicrophone((value) => !value)} className="rounded-lg border border-[#2A3D64] px-3 py-2 text-sm">{microphone ? "Mute microphone" : "Unmute microphone"}</button><button type="button" onClick={() => setCamera((value) => !value)} className="rounded-lg border border-[#2A3D64] px-3 py-2 text-sm">{camera ? "Turn camera off" : "Turn camera on"}</button><button type="button" onClick={() => setSharing((value) => !value)} className="rounded-lg border border-[#2A3D64] px-3 py-2 text-sm">{sharing ? "Stop sharing" : "Share screen"}</button><button type="button" onClick={() => setConnected(false)} className="rounded-lg border border-rose-400/40 px-3 py-2 text-sm text-rose-200">Leave</button></div>{sharing && <p className="mt-4 text-sm text-indigo-300">Screen sharing is active.</p>}</section>;
}

const featureFlows = {
   video: [
      "Create a call",
      "Issue participant access",
      "Connect browsers",
      "Start camera and microphone",
   ],
   audio: [
      "Create a call",
      "Grant microphone permission",
      "Connect browsers",
      "Manage the audio session",
   ],
   screen: [
      "Choose share",
      "Browser permission",
      "Screen, window, or tab",
      "Participants receive the stream",
   ],
   webrtc: [
      "Authenticate participant",
      "Signal connection",
      "Negotiate ICE",
      "Use direct or TURN media path",
   ],
} as const;

export function FeatureFlow({ kind }: { kind: keyof typeof featureFlows }) {
   const [active, setActive] = useState(0);
   const steps = featureFlows[kind];
   return (
      <section className="rounded-2xl border border-[#1A2642] bg-[#0A0F1E] p-5 md:p-8">
         <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
               <button
                  type="button"
                  key={step}
                  onClick={() => setActive(index)}
                  className={`rounded-xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-300 ${active === index ? "border-indigo-400 bg-indigo-500/15 text-white" : "border-[#1A2642] text-slate-400 hover:text-white"}`}
               >
                  <span className="font-mono text-xs text-indigo-300">
                     0{index + 1}
                  </span>
                  <span className="mt-2 block font-medium">{step}</span>
               </button>
            ))}
         </div>
         <p className="mt-5 rounded-lg bg-[#060B18] p-4 text-sm leading-6 text-slate-400">
            {kind === "screen" && active === 1
               ? "The browser, not your application, presents the permission picker and determines what a participant can share."
               : kind === "webrtc" && active === 3
                 ? "TURN is a relay option for networks where a direct peer connection cannot be established."
                 : "BlueCallio keeps this stage connected to your server-controlled call lifecycle while your product retains control of its own experience."}
         </p>
      </section>
   );
}
