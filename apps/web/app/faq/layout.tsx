import type { Metadata } from "next";
import { pageMetadata } from "../lib/seo";
export const metadata: Metadata = pageMetadata({ title: "Frequently Asked Questions", description: "Answers to common questions about BlueCallio, video calling APIs, WebRTC, hosted UI, React components, screen sharing, and usage-based billing.", path: "/faq" });
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
