import type { Metadata } from "next";
import Link from "next/link";
import {
   ArchitectureExplorer,
   IntegrationSelector,
} from "../components/marketing/InteractiveTools";
import { ContentSection, PublicPage } from "../components/marketing/PublicPage";
import { JsonLd } from "../components/seo/JsonLd";
import { pageMetadata, siteUrl } from "../lib/seo";

export const metadata: Metadata = pageMetadata({
   title: "BlueCallio Developer Platform | Audio, Video & WebRTC",
   description:
      "Choose BlueCallio hosted UI, React components, or a headless SDK to add audio, video, screen sharing, and WebRTC communication to your application.",
   path: "/developers",
});

const tools = [
   [
      "REST API",
      "Create and manage calls from trusted backend code.",
      "/docs/rest-api",
   ],
   [
      "React SDK",
      "Compose a branded call interface from reusable components.",
      "/docs/react",
   ],
   [
      "JavaScript SDK",
      "Build a fully custom meeting experience with the headless engine.",
      "/docs/javascript",
   ],
   [
      "Hosted UI",
      "Send authorized participants to a ready-made meeting interface.",
      "/docs/hosted-ui",
   ],
   [
      "Webhooks",
      "Synchronize your backend with signed call-state notifications.",
      "/docs/webhooks",
   ],
   [
      "Screen sharing",
      "Add browser-native sharing to a communication experience.",
      "/docs/screen-sharing",
   ],
] as const;

export default function DevelopersPage() {
   return (
      <PublicPage
         eyebrow="For developers"
         title="Build real-time communication into your application."
         intro="Add audio, video and screen sharing using BlueCallio's hosted UI, React components, headless SDK or REST APIs."
         crumbs={[
            { label: "Home", href: "/" },
            { label: "Developers", href: "/developers" },
         ]}
      >
         <JsonLd
            data={{
               "@context": "https://schema.org",
               "@type": "SoftwareApplication",
               name: "BlueCallio",
               applicationCategory: "DeveloperApplication",
               operatingSystem: "Web",
               url: new URL("/developers", siteUrl).toString(),
               description:
                  "Developer tools for integrating real-time audio, video, and screen sharing.",
            }}
         />
         <section
            className="grid gap-4 md:grid-cols-3"
            aria-label="Integration paths"
         >
            {[
               [
                  "Hosted UI",
                  "Fastest integration",
                  "A ready-made meeting interface.",
               ],
               [
                  "React",
                  "Custom UI",
                  "Composable components for React products.",
               ],
               [
                  "Headless SDK",
                  "Full control",
                  "The engine beneath your own interface.",
               ],
               [
                  "REST API",
                  "Backend integration",
                  "Create and manage calls from any trusted server environment.",
               ],
            ].map(([name, label, description]) => (
               <article
                  key={name}
                  className="rounded-2xl border border-[#1A2642] bg-[#0A0F1E] p-6"
               >
                  <p className="font-mono text-xs uppercase tracking-widest text-indigo-300">
                     {label}
                  </p>
                  <h2 className="mt-3 text-xl font-bold text-white">{name}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                     {description}
                  </p>
               </article>
            ))}
         </section>
         <ContentSection title="Choose the integration that fits your product">
            <p>
               Start with the amount of frontend control you need. Every path
               keeps call creation and authorization in your backend.
            </p>
            <IntegrationSelector />
         </ContentSection>
         <ContentSection title="How the pieces connect">
            <p>
               Select a node to see its role in a production communication flow.
               BlueCallio works around browser WebRTC; it does not replace the
               browser media layer.
            </p>
            <ArchitectureExplorer />
         </ContentSection>
         <ContentSection title="What do I actually have to build?">
            <div className="grid gap-4 md:grid-cols-3">
               {[
                  [
                     "Hosted UI",
                     "You build authentication, business logic, and call creation.",
                     "BlueCallio handles the meeting UI, media controls, signaling, WebRTC setup, and TURN relay.",
                  ],
                  [
                     "React",
                     "You build your product layout, business logic, and branded UI.",
                     "BlueCallio handles participant state, media streams, controls, and the connection lifecycle.",
                  ],
                  [
                     "Headless SDK",
                     "You control the full UI, interactions, and application state.",
                     "BlueCallio provides the communication engine, signaling, WebRTC media lifecycle, and relay path.",
                  ],
               ].map(([name, build, handles]) => (
                  <article
                     key={name}
                     className="rounded-xl border border-[#1A2642] p-5"
                  >
                     <h3 className="font-semibold text-white">{name}</h3>
                     <p className="mt-3 text-sm text-slate-400">
                        <strong className="text-slate-200">You build:</strong>{" "}
                        {build}
                     </p>
                     <p className="mt-3 text-sm text-slate-400">
                        <strong className="text-slate-200">
                           BlueCallio handles:
                        </strong>{" "}
                        {handles}
                     </p>
                  </article>
               ))}
            </div>
         </ContentSection>
         <ContentSection title="Developer toolbox">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
               {tools.map(([name, description, href]) => (
                  <Link
                     key={name}
                     href={href}
                     className="rounded-xl border border-[#1A2642] p-5 transition hover:border-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-300"
                  >
                     <h3 className="font-semibold text-white">
                        {name} <span className="text-indigo-300">→</span>
                     </h3>
                     <p className="mt-2 text-sm leading-6 text-slate-400">
                        {description}
                     </p>
                  </Link>
               ))}
            </div>
         </ContentSection>
         <ContentSection title="Start with a server-controlled call">
            <p>
               Keep API keys on the server, issue participant-specific access
               only after your application authorizes a user, and then choose
               the meeting surface that fits the product.
            </p>
            <div className="flex flex-wrap gap-4">
               <Link
                  href="/docs/quickstart"
                  className="text-indigo-300 hover:text-white"
               >
                  Read the quickstart →
               </Link>
               <Link
                  href="/pricing"
                  className="text-indigo-300 hover:text-white"
               >
                  Understand usage pricing →
               </Link>
            </div>
         </ContentSection>
      </PublicPage>
   );
}
