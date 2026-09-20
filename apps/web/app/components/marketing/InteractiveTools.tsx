"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "../../lib/api";
import { useEffect } from "react";

const paths = [
   {
      id: "hosted",
      label: "Hosted UI",
      audience: "Ship a call experience with minimal frontend work.",
      builds: "Your backend creates the call and decides who can join.",
      handles:
         "Meeting UI, media controls, signaling, WebRTC setup, and TURN relay.",
      code: `const call = await client.createCall({ callerId, receiverId });\nredirect(call.callerUrl);`,
      href: "/docs/hosted-ui",
   },
   {
      id: "react",
      label: "React",
      audience: "Compose a branded meeting interface in a React application.",
      builds: "Your product layout, business logic, and branded experience.",
      handles:
         "Participant state, media streams, controls, signaling, and connection lifecycle.",
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
      code: `import { BlueCallioMeeting } from "@bluecallio/sdk";\n\nconst meeting = new BlueCallioMeeting({ token, callId, signalUrl });\nawait meeting.join();`,
      href: "/docs/javascript",
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
                     <dt className="font-semibold text-slate-200">You build</dt>
                     <dd className="text-slate-400">{item.builds}</dd>
                  </div>
                  <div>
                     <dt className="font-semibold text-slate-200">
                        BlueCallio handles
                     </dt>
                     <dd className="text-slate-400">{item.handles}</dd>
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

type Rates = {
   audioPaise: number;
   videoPaise: number;
   screenSharePaise: number;
   freeAudioMins: number;
   freeVideoMins: number;
};
export function PricingCalculator() {
   const [rates, setRates] = useState<Rates | null>(null);
   const [people, setPeople] = useState(2);
   const [minutes, setMinutes] = useState(10);
   const [video, setVideo] = useState(true);
   const [screen, setScreen] = useState(false);
   const [screenPeople, setScreenPeople] = useState(1);
   useEffect(() => {
      api.get("/billing/rates")
         .then((response) => setRates(response.data))
         .catch(() => {});
   }, []);
   const total = people * minutes;
   const allowance = rates
      ? video
         ? rates.freeVideoMins
         : rates.freeAudioMins
      : 0;
   const billable = Math.max(0, total - allowance);
   const screenMinutes = screen ? screenPeople * minutes : 0;
   const mediaRate = rates ? (video ? rates.videoPaise : rates.audioPaise) : 0;
   const amount = rates ? ((billable * mediaRate) + (screenMinutes * rates.screenSharePaise)) / 100 : 0;
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
               Call duration (minutes){" "}
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
         {screen && <label className="mt-5 block max-w-xs text-sm text-slate-300">Screen-sharing participants <input aria-label="Screen-sharing participants" type="number" min="1" max={people} value={screenPeople} onChange={(event) => setScreenPeople(Math.min(people, Math.max(1, Number(event.target.value))))} className="mt-2 w-full rounded-lg border border-[#2A3D64] bg-[#060B18] p-3 text-white" /></label>}
         <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-[#060B18] p-4">
               <p className="text-xs text-slate-500">{video ? "Video" : "Audio"} participant-minutes</p>
               <p className="mt-1 text-xl font-bold text-white">{total}</p>
            </div>
            <div className="rounded-lg bg-[#060B18] p-4">
               <p className="text-xs text-slate-500">Included allowance</p>
               <p className="mt-1 text-xl font-bold text-white">
                  {rates ? allowance : "…"}
               </p>
            </div>
            <div className="rounded-lg bg-[#060B18] p-4">
               <p className="text-xs text-slate-500">Billable media minutes</p>
               <p className="mt-1 text-xl font-bold text-white">
                  {rates ? billable : "…"}
               </p>
            </div>
            <div className="rounded-lg bg-[#060B18] p-4">
               <p className="text-xs text-slate-500">Screen-sharing minutes</p>
               <p className="mt-1 text-xl font-bold text-white">{screenMinutes}</p>
            </div>
            <div className="rounded-lg bg-[#060B18] p-4">
               <p className="text-xs text-slate-500">Estimated pre-tax cost</p>
               <p className="mt-1 text-xl font-bold text-white">
                  {rates ? `₹${amount.toFixed(2)}` : "Loading rates…"}
               </p>
            </div>
         </div>
      </section>
   );
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
