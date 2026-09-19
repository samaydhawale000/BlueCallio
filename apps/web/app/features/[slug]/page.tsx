import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ContentSection, PublicPage } from "../../components/marketing/PublicPage";
import { JsonLd } from "../../components/seo/JsonLd";
import { pageMetadata, siteUrl } from "../../lib/seo";

const features = {
  "video-calling": { title: "Video Calling API for Your Application", meta: "Video Calling API | WebRTC Video SDK", description: "Add browser-based video calling with BlueCallio's WebRTC API, hosted UI, React components, and headless SDK.", summary: "BlueCallio provides the building blocks for adding browser video calls to a product without making your team assemble signaling, authentication, and call UI from scratch.", details: ["Create and manage calls through REST APIs, then bring participants into a hosted call UI or your own interface.", "Use React components for a composable UI, or use the headless SDK when your product needs full presentation control."] },
  "audio-calling": { title: "Audio Calling API for Web Applications", meta: "Audio Calling API | WebRTC Voice SDK", description: "Add browser audio calling with BlueCallio's WebRTC APIs, hosted UI, React components, and headless SDK.", summary: "BlueCallio helps developers add real-time browser audio to web applications through the same API, hosted UI, React, and headless integration paths used for calls.", details: ["Audio calling uses the platform's real-time signaling and authentication flow.", "Choose hosted UI for a ready-made meeting experience or build a tailored experience with the SDKs."] },
  "screen-sharing": { title: "Add Screen Sharing to Your Application", meta: "Screen Sharing API | WebRTC Screen Sharing SDK", description: "Add browser screen sharing to a calling experience with BlueCallio's hosted UI, React components, and headless SDK.", summary: "BlueCallio supports screen sharing in its hosted UI, React components, and headless SDK, so teams can offer browser-native sharing alongside a call.", details: ["Participants choose what to share through their browser's permission prompt.", "Screen sharing is billed as an additional participant-minute on top of video usage; see pricing for current rates."] },
  webrtc: { title: "WebRTC Infrastructure Without the Infrastructure Headache", meta: "WebRTC API & Infrastructure", description: "Use BlueCallio's WebRTC APIs, signaling, TURN relay, hosted UI, React components, and headless SDK for real-time communication.", summary: "BlueCallio is a developer-focused real-time communication platform that combines WebRTC with the practical application layers teams need: signaling, authentication, TURN relay, APIs, SDKs, and optional hosted UI.", details: ["The platform provides WebSocket signaling and time-limited TURN credentials for connectivity paths that need a relay.", "Developers can start with hosted UI and later move to React components or the headless SDK without changing the product's core call model."] },
} as const;

type Slug = keyof typeof features;
export function generateStaticParams() { return Object.keys(features).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const item = features[slug as Slug]; return item ? pageMetadata({ title: item.meta, description: item.description, path: `/features/${slug}` }) : {}; }

export default async function FeaturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const item = features[slug as Slug]; if (!item) notFound();
  const path = `/features/${slug}`;
  return <PublicPage eyebrow="BlueCallio features" title={item.title} intro={item.summary} crumbs={[{ label: "Home", href: "/" }, { label: "Features", href: "/#features" }, { label: item.title, href: path }]}>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "SoftwareApplication", name: "BlueCallio", applicationCategory: "DeveloperApplication", operatingSystem: "Web", url: new URL(path, siteUrl).toString(), description: item.description }} />
    <ContentSection title="A practical path from integration to production">{item.details.map((detail) => <p key={detail}>{detail}</p>)}</ContentSection>
    <ContentSection title="Integrate in the way your product needs"><ul className="list-disc space-y-2 pl-5"><li><strong className="text-slate-200">Hosted UI:</strong> create a call from your backend and send participants to a ready-made call page.</li><li><strong className="text-slate-200">React components:</strong> compose a call experience with reusable UI components.</li><li><strong className="text-slate-200">Headless SDK:</strong> keep the call engine while designing every part of the interface yourself.</li></ul></ContentSection>
    <ContentSection title="Related resources"><div className="flex flex-wrap gap-4"><Link href="/docs/quickstart" className="text-indigo-300 hover:text-white">Quickstart →</Link><Link href="/docs/react" className="text-indigo-300 hover:text-white">React SDK →</Link><Link href="/docs/javascript" className="text-indigo-300 hover:text-white">JavaScript SDK →</Link><Link href="/pricing" className="text-indigo-300 hover:text-white">Pricing →</Link></div></ContentSection>
  </PublicPage>;
}
