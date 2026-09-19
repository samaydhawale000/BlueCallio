import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
   ContentSection,
   PublicPage,
} from "../../components/marketing/PublicPage";
import { JsonLd } from "../../components/seo/JsonLd";
import { pageMetadata, siteUrl } from "../../lib/seo";

// Render documentation on request so the client marketing shell and its
// persisted-session state are not evaluated during static export.
export const dynamic = "force-dynamic";

const docs = {
   quickstart: {
      title: "Quickstart: Create Your First Call",
      meta: "Video Calling API Quickstart",
      description:
         "Start a BlueCallio call integration: create a call from your backend and choose hosted UI, React components, or the headless SDK.",
      lead: "Create a call from your backend, then direct each participant to the integration surface that fits your product. BlueCallio provides a hosted call UI, React components, and a headless SDK.",
      sections: [
         [
            "Start with a call",
            "Use the REST API from your trusted backend to create a call and issue participant access. Keep API keys on the server; never expose them in browser code.",
         ],
         [
            "Choose an integration path",
            "Use hosted UI for the shortest path, React components for a composable interface, or the headless SDK when you own every part of the call experience.",
         ],
      ],
   },
   authentication: {
      title: "Authentication",
      meta: "API Authentication",
      description:
         "Learn how BlueCallio authentication separates server API credentials from participant access for calls.",
      lead: "BlueCallio integrations use server-side credentials for API requests and scoped participant access for joining a call.",
      sections: [
         [
            "Keep API keys on your server",
            "Create calls and manage project resources from a trusted backend. Do not put project API keys in a client application or a public URL.",
         ],
         [
            "Issue participant access",
            "Pass the participant-specific access returned when a call is created to the chosen call integration. Each participant should receive only their own access.",
         ],
      ],
   },
   javascript: {
      title: "Build Video Calling with JavaScript",
      meta: "JavaScript Video Calling SDK",
      description:
         "Use the BlueCallio JavaScript headless SDK to build a custom video, audio, and screen sharing experience.",
      lead: "The BlueCallio headless SDK gives JavaScript applications control over the meeting experience while the platform handles the call engine, signaling, authentication, and media infrastructure.",
      sections: [
         [
            "Build your own interface",
            "Use the headless SDK when a ready-made meeting UI does not match your product. Your application owns the controls and layout.",
         ],
         [
            "Handle call state",
            "Use the SDK's meeting and media controls to join or leave calls, manage devices, and start or stop screen sharing.",
         ],
      ],
   },
   react: {
      title: "Add Video Calling to React",
      meta: "React Video Calling SDK",
      description:
         "Use BlueCallio React components to add a video, audio, and screen sharing experience to a React application.",
      lead: "BlueCallio React components let product teams compose a branded calling experience without implementing WebRTC negotiation and signaling UI from scratch.",
      sections: [
         [
            "Compose the meeting UI",
            "Build with the MeetingProvider, participant views, controls, device selection, and waiting-room capabilities exposed by the React package.",
         ],
         [
            "Keep product control",
            "React components are a middle path between hosted UI and the headless SDK: integrate reusable UI while still shaping the experience around your application.",
         ],
      ],
   },
   "rest-api": {
      title: "REST API for Calls",
      meta: "Video Calling REST API",
      description:
         "Create, accept, reject, end, join, leave, and inspect BlueCallio calls through the REST API.",
      lead: "The BlueCallio REST API gives your backend a clear call lifecycle: create, accept, reject, join, leave, end, and inspect calls.",
      sections: [
         [
            "Call lifecycle",
            "Create calls on the server and use the returned information to connect participants through hosted UI or an SDK integration.",
         ],
         [
            "Use server-side requests",
            "REST operations are intended for trusted backend code. Pair API calls with your application's own authorization checks.",
         ],
      ],
   },
   calls: {
      title: "Calls and Participants",
      meta: "Calls API Guide",
      description:
         "Understand the BlueCallio call lifecycle, participant access, hosted call URLs, and call management.",
      lead: "A BlueCallio call represents the shared real-time session your application creates and manages for its participants.",
      sections: [
         [
            "Create and manage calls",
            "Your backend controls the lifecycle through the REST API, including creation and the actions available as a call progresses.",
         ],
         [
            "Connect participants",
            "A created call provides participant-specific connection information. Choose hosted UI for a ready-made page or connect through an SDK.",
         ],
      ],
   },
   "screen-sharing": {
      title: "Add Screen Sharing with WebRTC",
      meta: "WebRTC Screen Sharing API",
      description:
         "Add browser screen sharing with BlueCallio's hosted UI, React components, or headless JavaScript SDK.",
      lead: "BlueCallio supports browser screen sharing across hosted UI, React components, and the headless SDK.",
      sections: [
         [
            "Respect browser permissions",
            "Screen selection and permission are controlled by the participant's browser. Design your product flow so the user understands what they are sharing.",
         ],
         [
            "Understand usage",
            "Screen sharing is an additional billable participant-minute on top of video usage. Check pricing and billing terms for details.",
         ],
      ],
   },
   "hosted-ui": {
      title: "Hosted Call UI",
      meta: "Hosted Video Call UI",
      description:
         "Use BlueCallio hosted UI to add a ready-made audio, video, and screen sharing call experience to your product.",
      lead: "Hosted UI is the fastest BlueCallio integration: create a call from your backend and direct participants to the returned hosted call URL.",
      sections: [
         [
            "A ready-made call experience",
            "Hosted UI includes the call interface, device selection, media controls, and screen sharing, so your team can avoid building a meeting frontend for the first release.",
         ],
         [
            "Keep call creation in your backend",
            "Your application remains responsible for deciding who can create or join a call. Generate call access only from trusted server code.",
         ],
      ],
   },
   webhooks: {
      title: "Webhooks",
      meta: "Call Event Webhooks",
      description:
         "Receive and verify BlueCallio webhook events for changes in call state.",
      lead: "BlueCallio can notify your backend when call state changes so your application can synchronize its own workflows.",
      sections: [
         [
            "Verify every request",
            "Webhook requests include an HMAC-SHA256 signature. Verify the signature before acting on an event.",
         ],
         [
            "Design for retries",
            "Treat webhook delivery as an event notification, not the only source of truth. Make event handling idempotent in your application.",
         ],
      ],
   },
   "usage-billing": {
      title: "Usage and Billing",
      meta: "Video Calling API Usage & Billing",
      description:
         "Understand BlueCallio participant-minute usage, free allowances, billing cycles, invoices, and the usage dashboard.",
      lead: "BlueCallio uses participant-minutes: each participant's time in a call is measured. For example, two participants in a ten-minute call use twenty participant-minutes.",
      sections: [
         [
            "What is included",
            "The current free allowance and media rates are shown on the pricing page and in the product. Billing begins only for usage beyond the applicable free allowance.",
         ],
         [
            "Track usage",
            "Use the dashboard to review usage and invoices. Screen sharing is billed in addition to video usage as described in the billing terms.",
         ],
      ],
   },
} as const;
type DocSlug = keyof typeof docs;
export function generateStaticParams() {
   return Object.keys(docs).map((slug) => ({ slug }));
}
export async function generateMetadata({
   params,
}: {
   params: Promise<{ slug: string }>;
}): Promise<Metadata> {
   const { slug } = await params;
   const doc = docs[slug as DocSlug];
   return doc
      ? pageMetadata({
           title: doc.meta,
           description: doc.description,
           path: `/docs/${slug}`,
        })
      : {};
}
export default async function DocPage({
   params,
}: {
   params: Promise<{ slug: string }>;
}) {
   const { slug } = await params;
   const doc = docs[slug as DocSlug];
   if (!doc) notFound();
   const path = `/docs/${slug}`;
   return (
      <PublicPage
         eyebrow="BlueCallio documentation"
         title={doc.title}
         intro={doc.lead}
         crumbs={[
            { label: "Home", href: "/" },
            { label: "Docs", href: "/docs" },
            { label: doc.title, href: path },
         ]}
      >
         <JsonLd
            data={{
               "@context": "https://schema.org",
               "@type": "TechArticle",
               headline: doc.title,
               description: doc.description,
               url: new URL(path, siteUrl).toString(),
               publisher: {
                  "@type": "Organization",
                  name: "BlueCallio",
                  url: siteUrl.toString(),
               },
            }}
         />
         {doc.sections.map(([title, body]) => (
            <ContentSection title={title} key={title}>
               <p>{body}</p>
            </ContentSection>
         ))}
         <ContentSection title="Related documentation">
            <div className="flex flex-wrap gap-4">
               <Link
                  href="/docs/quickstart"
                  className="text-indigo-300 hover:text-white"
               >
                  Quickstart →
               </Link>
               <Link
                  href="/docs/authentication"
                  className="text-indigo-300 hover:text-white"
               >
                  Authentication →
               </Link>
               <Link
                  href="/docs/react"
                  className="text-indigo-300 hover:text-white"
               >
                  React SDK →
               </Link>
               <Link
                  href="/features/video-calling"
                  className="text-indigo-300 hover:text-white"
               >
                  Video Calling →
               </Link>
               <Link
                  href="/pricing"
                  className="text-indigo-300 hover:text-white"
               >
                  Pricing →
               </Link>
            </div>
         </ContentSection>
      </PublicPage>
   );
}
