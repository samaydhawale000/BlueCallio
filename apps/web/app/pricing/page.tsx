import type { Metadata } from "next";
import { ContentSection, PublicPage } from "../components/marketing/PublicPage";
import PricingSection from "../components/PricingSection";
import { pageMetadata } from "../lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Video Calling API Pricing", description: "BlueCallio offers usage-based pricing for audio, video, and screen sharing participant-minutes, with a free monthly allowance.", path: "/pricing" });
export default function PricingPage() { return <main className="min-h-screen bg-[#060B18] pt-20"><PublicPage eyebrow="Pricing" title="Simple, Usage-Based Pricing for Real-Time Communication" intro="BlueCallio bills by participant-minute. Two participants in a ten-minute call use twenty participant-minutes. Current rates and free allowances are shown below." crumbs={[{ label: "Home", href: "/" }, { label: "Pricing", href: "/pricing" }]}><ContentSection title="Understand participant-minutes"><p>Each participant contributes usage while connected. Audio and video are measured separately, and screen sharing is billed in addition to video usage. Your dashboard shows usage and invoices for your account.</p></ContentSection></PublicPage><PricingSection /></main>; }
