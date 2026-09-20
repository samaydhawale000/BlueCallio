import type { Metadata } from "next";
import Link from "next/link";
import { ContentSection, PublicPage } from "../components/marketing/PublicPage";
import { JsonLd } from "../components/seo/JsonLd";
import { BLUECALLIO_DESCRIPTION, BLUECALLIO_NAME } from "../lib/brand";
import { pageMetadata, siteUrl } from "../lib/seo";

export const metadata: Metadata = pageMetadata({
   title: "What is BlueCallio? | Real-Time Communication Infrastructure",
   description:
      "Learn what BlueCallio is, how its audio and video communication infrastructure works, and how developers can integrate it using hosted UI, React components, SDKs and APIs.",
   path: "/what-is-bluecallio",
});

const faqs = [
   ["What is BlueCallio?", BLUECALLIO_DESCRIPTION],
   ["What can I build with BlueCallio?", "Developers can build 1:1 audio calls, 1:1 video calls, screen sharing, custom communication interfaces, and embedded calling experiences."],
   ["Does BlueCallio support video calls?", "Yes. BlueCallio supports video calling."],
   ["Does BlueCallio support audio calls?", "Yes. BlueCallio supports audio calling and audio participant usage tracking."],
   ["Does BlueCallio support screen sharing?", "Yes. Screen sharing is supported and tracked as a separate billable usage category."],
   ["Does BlueCallio have a JavaScript SDK?", "Yes. @bluecallio/sdk is the official JavaScript and TypeScript SDK."],
   ["Does BlueCallio have React components?", "Yes. @bluecallio/react provides official React components and hooks."],
   ["How does BlueCallio pricing work?", "BlueCallio uses participant-minute usage pricing. Audio, video, and screen sharing are tracked as separate usage categories."],
   ["Where is the BlueCallio API documentation?", "The official API documentation is available at bluecallio.com/docs/rest-api."],
] as const;

const integrationPaths = [
   ["Hosted UI", "Use a ready-made calling interface when you want the shortest frontend path."],
   ["React components", "Compose a branded meeting experience from BlueCallio React components and hooks."],
   ["Headless SDK", "Use the JavaScript and TypeScript meeting engine when your application owns the entire interface."],
   ["REST API", "Create and manage calls from trusted backend code in any language."],
] as const;

export default function WhatIsBlueCallioPage() {
   return (
      <PublicPage
         eyebrow="About BlueCallio"
         title="What is BlueCallio?"
         intro={BLUECALLIO_DESCRIPTION}
         crumbs={[
            { label: "Home", href: "/" },
            { label: "What is BlueCallio?", href: "/what-is-bluecallio" },
         ]}
      >
         <JsonLd
            data={[
               {
                  "@context": "https://schema.org",
                  "@type": "WebPage",
                  name: "What is BlueCallio?",
                  description: BLUECALLIO_DESCRIPTION,
                  url: new URL("/what-is-bluecallio", siteUrl).toString(),
                  about: { "@type": "Organization", name: BLUECALLIO_NAME },
               },
               {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: faqs.map(([name, text]) => ({
                     "@type": "Question",
                     name,
                     acceptedAnswer: { "@type": "Answer", text },
                  })),
               },
            ]}
         />
         <ContentSection title="What is BlueCallio?">
            <p>{BLUECALLIO_DESCRIPTION}</p>
            <p>BlueCallio is an independent developer-focused real-time communication platform. It gives application teams official integration surfaces instead of requiring them to assemble signaling, participant sessions, and calling interfaces from scratch.</p>
         </ContentSection>
         <ContentSection title="Who is BlueCallio for?">
            <ul className="grid gap-3 sm:grid-cols-2">
               {["SaaS products", "Marketplaces", "Education platforms", "Healthcare applications", "Customer support applications", "Internal business applications", "Developer products"].map((item) => (
                  <li key={item} className="rounded-xl border border-[#1A2642] bg-[#0A0F1E] p-4 text-slate-300">{item}</li>
               ))}
            </ul>
         </ContentSection>
         <ContentSection title="What can developers build?">
            <ul className="list-disc space-y-2 pl-5">
               <li>1:1 audio calls</li>
               <li>1:1 video calls</li>
               <li>Browser screen sharing</li>
               <li>Custom communication interfaces</li>
               <li>Embedded calling experiences</li>
            </ul>
         </ContentSection>
         <ContentSection title="How developers integrate BlueCallio">
            <div className="grid gap-4 sm:grid-cols-2">
               {integrationPaths.map(([name, description]) => (
                  <article key={name} className="rounded-xl border border-[#1A2642] bg-[#0A0F1E] p-5">
                     <h3 className="font-semibold text-white">{name}</h3>
                     <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                  </article>
               ))}
            </div>
         </ContentSection>
         <ContentSection title="How BlueCallio works">
            <div className="overflow-x-auto rounded-xl border border-[#1A2642] bg-[#0A0F1E] p-6 font-mono text-sm leading-7 text-slate-300">
               <pre>{`Your Application
       |
       +------------------+
       |                  |
       v                  v
Your Backend          Your Frontend
       |                  |
       | API Key          | Session Information
       v                  |
BlueCallio API <----------+
       |
       v
Call / Participant Session
       |
       v
WebRTC
       |
   STUN / TURN
       |
       v
Participants`}</pre>
            </div>
         </ContentSection>
         <ContentSection title="BlueCallio vs building WebRTC yourself">
            <p>When building directly with WebRTC, developers still need to design signaling, session management, authentication boundaries, participant state, media permissions, connection lifecycle, WebRTC state, and TURN connectivity. BlueCallio provides the integration surfaces around those concerns while your application retains control of its product flow and interface.</p>
         </ContentSection>
         <ContentSection title="Security">
            <div className="grid gap-4 sm:grid-cols-2">
               <article className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-5 text-amber-100"><h3 className="font-semibold">Project API key: server only</h3><p className="mt-2 text-sm">Never expose the project API key in frontend or browser code.</p></article>
               <article className="rounded-xl border border-[#1A2642] bg-[#0A0F1E] p-5"><h3 className="font-semibold text-white">Browser: session information only</h3><p className="mt-2 text-sm text-slate-400">Your backend authorizes application users and returns the participant-specific information needed to join.</p></article>
            </div>
         </ContentSection>
         <ContentSection title="Pricing">
            <p>BlueCallio uses usage-based participant-minute pricing. Audio, video, and screen sharing are separate usage categories.</p>
            <Link href="/pricing" className="font-medium text-indigo-300 hover:text-white">View official BlueCallio pricing →</Link>
         </ContentSection>
         <ContentSection title="Developer resources">
            <div className="flex flex-wrap gap-4">
               {[["Developer platform", "/developers"], ["Documentation", "/docs"], ["JavaScript SDK", "/docs/javascript"], ["React components", "/docs/react"], ["REST API", "/docs/rest-api"], ["Pricing", "/pricing"]].map(([label, href]) => <Link key={href} href={href} className="text-indigo-300 hover:text-white">{label} →</Link>)}
            </div>
         </ContentSection>
         <ContentSection title="Frequently asked questions">
            <div className="space-y-4">
               {faqs.map(([question, answer]) => <article key={question} className="rounded-xl border border-[#1A2642] bg-[#0A0F1E] p-5"><h3 className="font-semibold text-white">{question}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{answer}</p></article>)}
            </div>
         </ContentSection>
      </PublicPage>
   );
}
